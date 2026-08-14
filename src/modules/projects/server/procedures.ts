import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { generateSlug } from "random-word-slugs";

import { db } from "@/lib/db";
import { consumeCredits, restoreCredits } from "@/lib/usage";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { inngest } from "@/inngest/client";

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

  getMany: protectedProcedure.query(async ({ ctx }) => {
    const projects = await db.project.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      orderBy: { createdAt: "asc" },
    });

    return projects;
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
        if (error instanceof Error) {
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
            name: generateSlug(2, { format: "kebab" }),
            userId: ctx.auth.userId,

            messages: {
              create: {
                content: input.prompt,
                role: "USER",
                type: "RESULT",
              },
            },
          },
        });

        /** Triger code agent background job **/
        await inngest.send({
          name: "code-agent/run",
          data: {
            prompt: input.prompt,
            projectId: newProject.id,
          },
        });

        return newProject;
      } catch (error) {
        // Post-charge work failed before the job was accepted: give the
        // consumed credit back so it isn't lost, then surface the original
        // error. A restore failure must not mask the real cause.
        await restoreCredits().catch(() => undefined);
        throw error;
      }
    }),
});
