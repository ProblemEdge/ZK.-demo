-- Update VisibilityScope enum from FOLLOWERS to FRIENDS
-- Step 1: Add new FRIENDS value to enum
ALTER TYPE "VisibilityScope" ADD VALUE IF NOT EXISTS 'FRIENDS';
