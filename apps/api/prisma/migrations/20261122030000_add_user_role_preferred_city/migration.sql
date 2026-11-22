-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterEnum
ALTER TYPE "ClubRole" RENAME VALUE 'ADMIN' TO 'HOST';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferredCity" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
