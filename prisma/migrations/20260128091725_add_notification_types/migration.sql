-- AlterTable: Add new notification types
-- SQLite doesn't support ALTER TYPE directly, so we need to check the current schema
-- The new enum values are: POST_APPROVED, POST_REJECTED, COMMENT_RECEIVED, POST_CREATED
-- These will be used in the application code and Prisma will validate them

