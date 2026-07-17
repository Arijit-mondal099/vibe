import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const cache = global as unknown as {
  db: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const db = cache.db || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") cache.db = db;

export { db };
