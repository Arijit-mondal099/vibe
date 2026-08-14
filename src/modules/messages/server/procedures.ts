import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { consumeCredits } from "@/lib/usage";

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
            message: "You have run out of cradits",
          });
        }
      }

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
        name: "code-agent/run",
        data: {
          prompt: input.prompt,
          projectId: input.projectId,
        },
      });

      return createdMessage;
    }),
});
