import { RateLimiterPrisma } from "rate-limiter-flexible";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";

const TABLE_NAME = "Usage" as const;
const PRO_PLAN = "pro" as const;
const FREE_POINTS = 5 as const;
const PRO_POINTS = 100 as const;
const DURATION = 30 * 24 * 60 * 60; // 30 days
const GENERATION_COST = 1 as const;

export async function getUsageTracker() {
  const { has } = await auth();
  const hasProAccess = has({ plan: PRO_PLAN });

  const usageTracker = new RateLimiterPrisma({
    storeClient: db,
    tableName: TABLE_NAME,
    points: hasProAccess ? PRO_POINTS : FREE_POINTS,
    duration: DURATION,
  });

  return usageTracker;
}

export async function consumeCredits() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not authenticated!");
  }

  const usageTracker = await getUsageTracker();
  const result = await usageTracker.consume(userId, GENERATION_COST);

  return result;
}

export async function getUsageStatus() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User is not authenticated!");
  }

  const usageTracker = await getUsageTracker();
  const result = await usageTracker.get(userId);

  return result;
}
