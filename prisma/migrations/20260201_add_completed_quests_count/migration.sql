-- AlterTable
ALTER TABLE "User" ADD COLUMN "completedQuestsCount" INTEGER NOT NULL DEFAULT 0;

-- Update existing users with their current quest count
UPDATE "User" u
SET "completedQuestsCount" = (
  SELECT COUNT(*)
  FROM "Post" p
  WHERE p."userId" = u.id 
    AND p."isApproved" = true 
    AND p."questId" IS NOT NULL
);
