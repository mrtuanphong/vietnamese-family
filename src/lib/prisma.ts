import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    try {
      const url = new URL(connectionString);
      const host = url.hostname;
      const endpoint = host.split(".")[0] ?? host;
      console.log("\n========================================");
      console.log(`🔌 [Database] Host: ${host}`);
      console.log(`📌 [Database] Endpoint ID: ${endpoint}`);
      console.log(`🗄️  [Database] Name: ${url.pathname.replace(/^\//, "")}`);
      console.log("========================================\n");
    } catch {
      console.log("🔌 [Database] Connected via DATABASE_URL");
    }
  } else {
    console.warn("⚠️ [Database] DATABASE_URL is not set!");
  }

  const adapter = new PrismaPg({ connectionString: connectionString! });
  return new PrismaClient({ adapter });
}

function getActiveClient(): PrismaClient {
  const existing = globalForPrisma.prisma as any;
  // If no instance or instance lacks models added recently (fund, user, transaction), recreate
  if (!existing || !existing.fund || !existing.transaction || !existing.user) {
    console.log("🔄 [Prisma] Initializing/Refreshing PrismaClient with models (fund, user, transaction)...");
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getActiveClient() as any;
    const value = client[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = getActiveClient();
}
