import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

// In development, Next.js hot-reloads modules on every save. A module-level
// `const db` would be re-created on each reload, exhausting database
// connections. Stashing the client on `global` lets one instance survive
// reloads for the whole dev session.
const cache = global as unknown as {
  db: PrismaClient;
};

// PrismaPg is a connection-pool adapter: it manages database connections
// automatically, so it just needs the validated connection string from env.
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

// Reuse the cached client if one already exists; otherwise create a fresh one.
const db = cache.db || new PrismaClient({ adapter });

// Only cache in non-production (dev/test) so hot reloads reuse the client.
// In production, modules load once per process and the adapter already pools
// connections, so caching on `global` is unnecessary.
if (env.NODE_ENV !== "production") cache.db = db;

export { db };
