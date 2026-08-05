import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { z } from "zod";

export const messageRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        projectId: z.string().min(1, { error: "Project ID is required" }),
      }),
    )
    .query(async ({ input }) => {
      const messages = await db.message.findMany({
        where: {
          projectId: input.projectId,
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

  create: baseProcedure
    .input(
      z.object({
        prompt: z
          .string()
          .min(1, { error: "Prompt is required!" })
          .max(10000, { error: "Prompt is too long!" }),
        projectId: z.string().min(1, { error: "Project ID is required" }),
      }),
    )
    .mutation(async ({ input }) => {
      /** Store user message to db **/
      const createdMessage = await db.message.create({
        data: {
          projectId: input.projectId,
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
