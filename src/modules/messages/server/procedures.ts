import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { consumeCredits, restoreCredits } from "@/lib/usage";
import { CODE_AGENT_FUNCTION_EVENT } from "@/inngest/functions/code-agent-function";

export const messageRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, { error: "Project ID is required" }),
      }),
    )
    .query(async ({ input, ctx }) => {
      const messages = await db.message.findMany({
        where: {
          projectId: input.projectId,
          project: {
            userId: ctx.auth.userId,
          },
        },
        include: {
          fragment: true,
        },
        orderBy: {
          updatedAt: "asc",
        },
      });

      return messages;
    }),

  create: protectedProcedure
    .input(
      z.object({
        prompt: z
          .string()
          .min(1, { error: "Prompt is required!" })
          .max(10000, { error: "Prompt is too long!" }),
        projectId: z.string().min(1, { error: "Project ID is required" }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existingProject = await db.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
      });

      if (!existingProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found!",
        });
      }

      /**
       * Consume credits
       * Validate user credits before create the message
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
        /** Store user message to db **/
        const createdMessage = await db.message.create({
          data: {
            projectId: existingProject.id,
            content: input.prompt,
            role: "USER",
            type: "RESULT",
          },
        });

        /** Triger code agent background job **/
        await inngest.send({
          name: CODE_AGENT_FUNCTION_EVENT,
          data: {
            prompt: input.prompt,
            projectId: input.projectId,
            messageId: createdMessage.id,
            messageCreatedAt: createdMessage.createdAt,
          },
        });

        return createdMessage;
      } catch (error) {
        // Post-charge work failed before the job was accepted: give the
        // consumed credit back so it isn't lost, then surface the original
        // error. A restore failure must not mask the real cause.
        await restoreCredits().catch(() => undefined);
        throw error;
      }
    }),
});
