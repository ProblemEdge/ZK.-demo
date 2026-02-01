-- Step 2: Update all existing FOLLOWERS posts to FRIENDS
UPDATE "Post" SET "visibilityScope" = 'FRIENDS' WHERE "visibilityScope" = 'FOLLOWERS';
