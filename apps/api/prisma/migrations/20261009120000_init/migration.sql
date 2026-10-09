-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('pl', 'en');

-- CreateEnum
CREATE TYPE "CareerMode" AS ENUM ('NORMAL', 'DAILY');

-- CreateEnum
CREATE TYPE "CareerStatus" AS ENUM ('ACTIVE', 'FINISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "Board" AS ENUM ('DAILY', 'TODAY', 'WEEK');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "displayName" VARCHAR(24) NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'pl',
    "selectedRacket" VARCHAR(32),
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedDay" CHAR(10),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Career" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "mode" "CareerMode" NOT NULL,
    "status" "CareerStatus" NOT NULL DEFAULT 'ACTIVE',
    "seed" VARCHAR(64) NOT NULL,
    "engineVersion" VARCHAR(16) NOT NULL,
    "config" JSONB NOT NULL,
    "dayKey" CHAR(10),
    "finishDay" CHAR(10),
    "weekKey" VARCHAR(8),
    "name" VARCHAR(64) NOT NULL,
    "gender" "Gender" NOT NULL,
    "background" VARCHAR(16) NOT NULL,
    "difficulty" VARCHAR(8) NOT NULL,
    "legacy" INTEGER,
    "rankable" BOOLEAN NOT NULL DEFAULT true,
    "verdict" VARCHAR(32),
    "seasons" INTEGER,
    "peakRank" INTEGER,
    "slamTitles" INTEGER,
    "titles" INTEGER,
    "prizeMoney" BIGINT,
    "summary" JSONB,
    "actions" JSONB,
    "actionCount" INTEGER NOT NULL DEFAULT 0,
    "rejectReason" VARCHAR(200),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAttempt" (
    "playerId" TEXT NOT NULL,
    "dayKey" CHAR(10) NOT NULL,
    "careerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyAttempt_pkey" PRIMARY KEY ("playerId","dayKey")
);

-- CreateTable
CREATE TABLE "PlayerAchievement" (
    "playerId" TEXT NOT NULL,
    "achievementId" VARCHAR(32) NOT NULL,
    "careerId" TEXT,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerAchievement_pkey" PRIMARY KEY ("playerId","achievementId")
);

-- CreateTable
CREATE TABLE "GoalProgress" (
    "playerId" TEXT NOT NULL,
    "goalKey" VARCHAR(32) NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalProgress_pkey" PRIMARY KEY ("playerId","goalKey")
);

-- CreateTable
CREATE TABLE "PeriodChampion" (
    "id" TEXT NOT NULL,
    "board" "Board" NOT NULL,
    "periodKey" VARCHAR(10) NOT NULL,
    "careerId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "legacy" INTEGER NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodChampion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_tokenHash_key" ON "Player"("tokenHash");

-- CreateIndex
CREATE INDEX "Player_lastSeenAt_idx" ON "Player"("lastSeenAt");

-- CreateIndex
CREATE INDEX "Career_playerId_status_idx" ON "Career"("playerId", "status");

-- CreateIndex
CREATE INDEX "Career_mode_status_finishedAt_idx" ON "Career"("mode", "status", "finishedAt" DESC);

-- CreateIndex
CREATE INDEX "Career_mode_dayKey_legacy_idx" ON "Career"("mode", "dayKey", "legacy" DESC);

-- CreateIndex
CREATE INDEX "Career_mode_finishDay_legacy_idx" ON "Career"("mode", "finishDay", "legacy" DESC);

-- CreateIndex
CREATE INDEX "Career_playerId_finishDay_idx" ON "Career"("playerId", "finishDay");

-- CreateIndex
CREATE INDEX "Career_weekKey_legacy_idx" ON "Career"("weekKey", "legacy" DESC);

-- CreateIndex
CREATE INDEX "Career_status_legacy_idx" ON "Career"("status", "legacy" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DailyAttempt_careerId_key" ON "DailyAttempt"("careerId");

-- CreateIndex
CREATE INDEX "PeriodChampion_playerId_idx" ON "PeriodChampion"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodChampion_board_periodKey_key" ON "PeriodChampion"("board", "periodKey");

-- AddForeignKey
ALTER TABLE "Career" ADD CONSTRAINT "Career_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttempt" ADD CONSTRAINT "DailyAttempt_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAttempt" ADD CONSTRAINT "DailyAttempt_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerAchievement" ADD CONSTRAINT "PlayerAchievement_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalProgress" ADD CONSTRAINT "GoalProgress_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodChampion" ADD CONSTRAINT "PeriodChampion_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodChampion" ADD CONSTRAINT "PeriodChampion_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

