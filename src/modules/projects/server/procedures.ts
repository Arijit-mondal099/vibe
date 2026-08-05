import { z } from "zod";
import { generateSlug } from "random-word-slugs";

import { db } from "@/lib/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { inngest } from "@/inngest/client";
import { TRPCError } from "@trpc/server";

export const projectRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, { error: "ID is required" }),
      }),
    )
    .query(async ({ input }) => {
      const project = await db.project.findUnique({
        where: {
          id: input.id,
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

  getMany: baseProcedure.query(async () => {
    const projects = await db.project.findMany({
      orderBy: { createdAt: "asc" },
    });

    return projects;
  }),

  create: baseProcedure
    .input(
      z.object({
        prompt: z
          .string()
          .min(1, { error: "Prompt is required!" })
          .max(10000, { error: "Prompt is too long!" }),
      }),
    )
    .mutation(async ({ input }) => {
      /** create project with message **/
      const newProject = await db.project.create({
        data: {
          name: generateSlug(2, { format: "kebab" }),
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
    }),
});
