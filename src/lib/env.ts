import { z } from "zod";

const envValidationSchema = z.object({
  NEXT_PUBLIC_APP_URI: z.string().min(1, { error: "NEXT_PUBLIC_APP_URI is required" }),

  NODE_ENV: z.enum(["development", "production", "test"]),
  INNGEST_DEV: z.string().optional(), // Only need for inngest dev mode
  DATABASE_URL: z.string().min(1, { error: "DATABASE_URL is required" }),
  OPENAI_API_KEY: z.string().min(1, { error: "OPENAI_API_KEY is required" }),
  E2B_API_KEY: z.string().min(1, { error: "E2B_API_KEY is required" }),
  VIBE_TEMPLATE: z.string().min(1, { error: "VIBE_TEMPLATE is required" }),
  TAVILY_API_KEY: z.string().min(1, { error: "TAVILY_API_KEY is required" }),
});

const row = {
  NEXT_PUBLIC_APP_URI: process.env.NEXT_PUBLIC_APP_URI,
  NODE_ENV: process.env.NODE_ENV,
  INNGEST_DEV: process.env.INNGEST_DEV,
  DATABASE_URL: process.env.DATABASE_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  E2B_API_KEY: process.env.E2B_API_KEY,
  VIBE_TEMPLATE: process.env.VIBE_TEMPLATE,
  TAVILY_API_KEY: process.env.TAVILY_API_KEY,
};

const parsed = envValidationSchema.safeParse(row);
if (!parsed.success) {
  console.error("Environment variable validation failed:", parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;
