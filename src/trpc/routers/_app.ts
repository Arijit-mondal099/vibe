import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { inngest } from "@/inngest/client";

export const appRouter = createTRPCRouter({
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),

  invoke: baseProcedure
    .input(
      z.object({
        prompt: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await inngest.send({
        name: "code-agent/run",
        data: {
          prompt: input.prompt,
        },
      });

      return {
        ok: true,
        message: "background job done",
      };
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
