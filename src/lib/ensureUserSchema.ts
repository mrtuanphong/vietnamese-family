import { prisma } from "@/lib/prisma";

let isInitialized = false;

export async function ensureUserSchema(): Promise<void> {
  if (isInitialized) return;

  try {
    // 1. Create User table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "email" TEXT,
        "password" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "avatarUrl" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "role" TEXT NOT NULL DEFAULT 'member',
        "adminModules" TEXT DEFAULT '[]',
        "personId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `);

    // 2. Create unique indexes if not exist
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_personId_key" ON "User"("personId");
    `);

    // 3. Add foreign key to Person if not exists
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'User_personId_fkey'
        ) THEN
          ALTER TABLE "User" ADD CONSTRAINT "User_personId_fkey" 
          FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    // 4. Data Migration: Auto-migrate any existing Person with phone & password to User table
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" ("id", "phone", "password", "fullName", "role", "adminModules", "personId", "createdAt", "updatedAt")
      SELECT
        'usr_' || id,
        phone,
        password,
        TRIM(CONCAT(lastName, ' ', COALESCE(middleName, ''), ' ', firstName)),
        COALESCE(role, 'member'),
        COALESCE(adminModules, '[]'),
        id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM "Person"
      WHERE phone IS NOT NULL AND password IS NOT NULL AND phone != ''
      ON CONFLICT ("phone") DO NOTHING;
    `);

    // 5. If Clan has superAdminId, ensure the corresponding User is super_admin
    await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "role" = 'super_admin'
      WHERE "personId" IN (
        SELECT "superAdminId" FROM "Clan" WHERE "superAdminId" IS NOT NULL
      );
    `);

    isInitialized = true;
    console.log("✅ [User Schema] Initialized and synchronized successfully.");
  } catch (error) {
    console.error("⚠️ [User Schema] Error initializing User schema:", error);
  }
}
