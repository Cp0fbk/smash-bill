-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'ZALO');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SHADOWBANNED', 'BANNED');

-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('BADMINTON');

-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('ADMIN', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SplitStrategyType" AS ENUM ('EQUAL', 'WEIGHTED', 'GUEST_FIXED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('COURT', 'SHUTTLECOCK', 'WATER', 'REFEREE', 'OTHER');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CHARGE', 'PAYMENT', 'ADJUSTMENT', 'REFUND', 'FUND_SURPLUS');

-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('FLAKING', 'CLASSIFIED_SCAM', 'SPAM', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "skillLevel" TEXT,
    "flakeCount" INTEGER NOT NULL DEFAULT 0,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "thumbsUp" INTEGER NOT NULL DEFAULT 0,
    "thumbsDown" INTEGER NOT NULL DEFAULT 0,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "shadowbanUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "sport" "Sport" NOT NULL DEFAULT 'BADMINTON',
    "inviteCode" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "bankBin" TEXT,
    "bankAccountNo" TEXT,
    "bankAccountName" TEXT,
    "defaultCourtFee" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMember" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "ClubRole" NOT NULL DEFAULT 'MEMBER',
    "publicToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "courtCount" INTEGER NOT NULL DEFAULT 1,
    "guestDeposit" INTEGER NOT NULL DEFAULT 50000,
    "splitStrategy" "SplitStrategyType" NOT NULL DEFAULT 'EQUAL',
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "settledAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "clubMemberId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "amountOwed" INTEGER NOT NULL DEFAULT 0,
    "isSettled" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "clubMemberId" TEXT,
    "matchId" TEXT,
    "type" "LedgerEntryType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "voidedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "clubMemberId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "transferNote" TEXT NOT NULL,
    "qrPayload" TEXT NOT NULL,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassifiedListing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrls" TEXT[],
    "contactZalo" TEXT,
    "contactPhone" TEXT,
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassifiedListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Club_inviteCode_key" ON "Club"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "Club_publicToken_key" ON "Club"("publicToken");

-- CreateIndex
CREATE INDEX "Club_ownerId_idx" ON "Club"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_publicToken_key" ON "ClubMember"("publicToken");

-- CreateIndex
CREATE INDEX "ClubMember_clubId_idx" ON "ClubMember"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMember_clubId_userId_key" ON "ClubMember"("clubId", "userId");

-- CreateIndex
CREATE INDEX "Match_clubId_scheduledAt_idx" ON "Match"("clubId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Attendance_matchId_idx" ON "Attendance"("matchId");

-- CreateIndex
CREATE INDEX "Attendance_clubMemberId_idx" ON "Attendance"("clubMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_matchId_clubMemberId_key" ON "Attendance"("matchId", "clubMemberId");

-- CreateIndex
CREATE INDEX "Expense_matchId_idx" ON "Expense"("matchId");

-- CreateIndex
CREATE INDEX "Expense_clubId_idx" ON "Expense"("clubId");

-- CreateIndex
CREATE INDEX "LedgerEntry_clubId_clubMemberId_idx" ON "LedgerEntry"("clubId", "clubMemberId");

-- CreateIndex
CREATE INDEX "LedgerEntry_matchId_idx" ON "LedgerEntry"("matchId");

-- CreateIndex
CREATE INDEX "PaymentRequest_clubMemberId_status_idx" ON "PaymentRequest"("clubMemberId", "status");

-- CreateIndex
CREATE INDEX "PaymentRequest_clubId_idx" ON "PaymentRequest"("clubId");

-- CreateIndex
CREATE INDEX "ClassifiedListing_sellerId_isSold_idx" ON "ClassifiedListing"("sellerId", "isSold");

-- CreateIndex
CREATE INDEX "UserReport_reportedUserId_idx" ON "UserReport"("reportedUserId");

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_clubMemberId_fkey" FOREIGN KEY ("clubMemberId") REFERENCES "ClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_clubMemberId_fkey" FOREIGN KEY ("clubMemberId") REFERENCES "ClubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_clubMemberId_fkey" FOREIGN KEY ("clubMemberId") REFERENCES "ClubMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassifiedListing" ADD CONSTRAINT "ClassifiedListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
