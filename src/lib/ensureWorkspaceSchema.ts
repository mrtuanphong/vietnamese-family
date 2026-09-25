import { prisma } from "@/lib/prisma";

let isWorkspaceInitialized = false;

export async function ensureWorkspaceSchema(): Promise<string> {
  // Always return the default workspace id if already initialized
  try {
    // 1. Create Workspace table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Workspace" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'CLAN',
        "address" TEXT,
        "description" TEXT,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "enabledModules" TEXT,
        "clanLastName" TEXT,
        "superAdminId" TEXT,
        "superAdminGeneration" INTEGER,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
      );
    `);

    // 2. Create WorkspaceMember table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WorkspaceMember" (
        "id" TEXT NOT NULL,
        "workspaceId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'member',
        "adminModules" TEXT DEFAULT '[]',
        "personId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
      );
    `);

    // 3. Unique index for (workspaceId, userId)
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceMember_workspaceId_userId_key" 
      ON "WorkspaceMember"("workspaceId", "userId");
    `);

    // 4. Foreign keys
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceMember_workspaceId_fkey'
        ) THEN
          ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey"
          FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceMember_userId_fkey'
        ) THEN
          ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    // 5. Add workspaceId column to Person table if not exists
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Person' AND column_name = 'workspaceId'
        ) THEN
          ALTER TABLE "Person" ADD COLUMN "workspaceId" TEXT;
        END IF;
      END $$;
    `);

    // 6. Add workspaceId column to Fund table if not exists
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Fund' AND column_name = 'workspaceId'
        ) THEN
          ALTER TABLE "Fund" ADD COLUMN "workspaceId" TEXT;
        END IF;
      END $$;
    `);

    // 7. Seed or migrate default Workspace from Clan
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Workspace" (
        "id", "name", "type", "address", "description", "enabled", 
        "enabledModules", "clanLastName", "superAdminId", "superAdminGeneration", 
        "createdAt", "updatedAt"
      )
      SELECT
        COALESCE(c."id", 'ws_default'),
        COALESCE(c."name", 'Họ Đỗ (Quảng Tái)'),
        'CLAN',
        c."address",
        c."description",
        COALESCE(c."enabled", true),
        c."enabledModules",
        c."clanLastName",
        c."superAdminId",
        c."superAdminGeneration",
        COALESCE(c."createdAt", CURRENT_TIMESTAMP),
        CURRENT_TIMESTAMP
      FROM (SELECT 1) dummy
      LEFT JOIN "Clan" c ON true
      LIMIT 1
      ON CONFLICT ("id") DO NOTHING;
    `);

    // Get the first/default workspace ID
    const firstWs: any[] = await prisma.$queryRawUnsafe(`
      SELECT "id" FROM "Workspace" ORDER BY "createdAt" ASC LIMIT 1;
    `);
    const defaultWsId = firstWs[0]?.id || 'ws_default';

    // 8. Backfill Person.workspaceId and Fund.workspaceId with defaultWsId
    await prisma.$executeRawUnsafe(`
      UPDATE "Person" SET "workspaceId" = '${defaultWsId}' WHERE "workspaceId" IS NULL;
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE "Fund" SET "workspaceId" = '${defaultWsId}' WHERE "workspaceId" IS NULL;
    `);

    // 9. Migrate all existing Users to WorkspaceMember in the default workspace
    await prisma.$executeRawUnsafe(`
      INSERT INTO "WorkspaceMember" (
        "id", "workspaceId", "userId", "role", "adminModules", "personId", "createdAt", "updatedAt"
      )
      SELECT
        'wsm_' || u."id",
        '${defaultWsId}',
        u."id",
        COALESCE(u."role", 'member'),
        COALESCE(u."adminModules", '[]'),
        u."personId",
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM "User" u
      ON CONFLICT ("workspaceId", "userId") DO NOTHING;
    `);

    isWorkspaceInitialized = true;
    console.log("✅ [Workspace Schema] Multi-workspace schema initialized and verified.");
    return defaultWsId;
  } catch (error) {
    console.error("⚠️ [Workspace Schema] Error ensuring Workspace schema:", error);
    return "ws_default";
  }
}
