import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { z } from "zod";

export const messageRouter = createTRPCRouter({
  getMany: baseProcedure.query(async () => {
    const messages = await db.message.findMany({
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
        prompt: z.string().min(1, { error: "Message is required" }),
      }),
    )
    .mutation(async ({ input }) => {
      /** Store user message to db **/
      const createdMessage = await db.message.create({
        data: {
          content: input.prompt,
          role: "USER",
          type: "RESULT",
        },
      });

      /** Triger  code agent background job **/
      await inngest.send({
        name: "code-agent/run",
        data: {
          prompt: input.prompt,
        },
      });

      return createdMessage;
    }),
});
