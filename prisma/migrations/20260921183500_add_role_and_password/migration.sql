-- AlterTable
ALTER TABLE "Person" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'member';
ALTER TABLE "Person" ADD COLUMN "password" TEXT;
