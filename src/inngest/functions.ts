import { inngest } from "./client";

export const processTask = inngest.createFunction(
  {
    id: "process-task",
    triggers: { event: "app/task.created" },
  },
  async ({ event, step }) => {
    const result = await step.run("handle-task", async () => {
      return { processed: true, id: event.data.id };
    });

    // video downloading
    await step.sleep("wait-a-moment", "10s");

    // vides analizeing
    await step.sleep("wait-a-moment", "5s");

    // genegrate summary of video
    await step.sleep("wait-a-moment", "5s");

    return { message: `Task ${event.data.id} complete`, result };
  },
);
