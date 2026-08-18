import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { db } from "@/lib/db";
import { consumeCredits, restoreCredits } from "@/lib/usage";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { inngest } from "@/inngest/client";
import { CODE_AGENT_FUNCTION_EVENT } from "@/inngest/functions/code-agent-function";
import { GEN_PROJ_FUN_EVENT } from "@/inngest/functions/gen-proj-name-fun";

export const projectRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, { error: "ID is required" }),
      }),
    )
    .query(async ({ input, ctx }) => {
      const project = await db.project.findUnique({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Project not found with ID: ${input.id}`,
        });
      }

      return project;
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        order: z.enum(["asc", "desc"]),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { page, limit, order } = input;

      const [projects, totalCount] = await Promise.all([
        db.project.findMany({
          where: {
            userId: ctx.auth.userId,
          },
          orderBy: { createdAt: order },
          take: limit,
          skip: (page - 1) * limit,
        }),
        db.project.count({
          where: {
            userId: ctx.auth.userId,
          },
        }),
      ]);

      return {
        items: projects,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      };
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, { error: "ID is required" }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Scope the delete by userId so users can only remove their own projects.
      const result = await db.project.deleteMany({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
      });

      if (result.count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Project not found with ID: ${input.id}`,
        });
      }

      return { success: true };
    }),

  create: protectedProcedure
    .input(
      z.object({
        prompt: z
          .string()
          .min(1, { error: "Prompt is required!" })
          .max(10000, { error: "Prompt is too long!" }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      /**
       * Consume credits
       * Validate user credits before create the project/vibe
       **/
      try {
        await consumeCredits();
      } catch (error: unknown) {
        // RateLimiterRes (rate limit exceeded) is not an Error instance.
        // Any other error (DB failure, auth, etc.) is an Error subclass.
        if (error instanceof Error) {
          console.error("projects.create: consumeCredits failed:", error);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Something went wrong...",
          });
        } else {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "You have run out of credits",
          });
        }
      }

      try {
        /** create project with message **/
        const newProject = await db.project.create({
          data: {
            name: "Unknown Project",
            userId: ctx.auth.userId,

            messages: {
              create: {
                content: input.prompt,
                role: "USER",
                type: "RESULT",
              },
            },
          },
          // The nested-created prompt message's id/createdAt are needed for
          // the code-agent event payload; a brand-new project has exactly
          // one message. The caller only consumes `data.id`, so widening the
          // return with the relation is safe.
          include: {
            messages: true,
          },
        });

        /** Triger project name generator job **/
        await inngest.send({
          name: GEN_PROJ_FUN_EVENT,
          data: {
            prompt: input.prompt,
            projectId: newProject.id,
          },
        });

        /** Triger code agent background job **/
        await inngest.send({
          name: CODE_AGENT_FUNCTION_EVENT,
          data: {
            prompt: input.prompt,
            projectId: newProject.id,
            messageId: newProject.messages[0].id,
            messageCreatedAt: newProject.messages[0].createdAt.toISOString(),
          },
        });

        return newProject;
      } catch (error) {
        // Post-charge work failed before the job was accepted: give the
        // consumed credit back so it isn't lost, then surface the original
        // error. A restore failure must not mask the real cause.
        await restoreCredits().catch((err) => {
          console.error("projects.create: restoreCredits failed:", err);
        });
        throw error;
      }
    }),
});
