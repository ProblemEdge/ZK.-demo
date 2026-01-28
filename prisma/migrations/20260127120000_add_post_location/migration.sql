-- Add optional geolocation columns for posts
ALTER TABLE "Post" ADD COLUMN "latitude" REAL;
ALTER TABLE "Post" ADD COLUMN "longitude" REAL;
ALTER TABLE "Post" ADD COLUMN "locationName" TEXT;
