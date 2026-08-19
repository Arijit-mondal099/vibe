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
  B2_KEY_ID: z.string().min(1, { error: "B2_KEY_ID is required" }),
  B2_APPLICATION_KEY: z
    .string()
    .min(1, { error: "B2_APPLICATION_KEY is required" }),
  B2_BUCKET_NAME: z
    .string()
    .min(1, { error: "B2_BUCKET_NAME is required" }),
  B2_REGION: z.string().min(1, { error: "B2_REGION is required" }),
  B2_ENDPOINT: z.string().min(1, { error: "B2_ENDPOINT is required" }),
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
  B2_KEY_ID: process.env.B2_KEY_ID,
  B2_APPLICATION_KEY: process.env.B2_APPLICATION_KEY,
  B2_BUCKET_NAME: process.env.B2_BUCKET_NAME,
  B2_REGION: process.env.B2_REGION,
  B2_ENDPOINT: process.env.B2_ENDPOINT,
};

const parsed = envValidationSchema.safeParse(row);
if (!parsed.success) {
  console.error("Environment variable validation failed:", parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;
