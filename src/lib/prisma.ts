import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
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

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
