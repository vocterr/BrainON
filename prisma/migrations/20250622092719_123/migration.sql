-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('INITIATED', 'RINGING', 'CONNECTED', 'ENDED', 'FAILED', 'REJECTED', 'MISSED');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

-- CreateTable
CREATE TABLE "CallRecord" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'INITIATED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "connectedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,

    CONSTRAINT "CallRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CallRecord_adminId_idx" ON "CallRecord"("adminId");

-- CreateIndex
CREATE INDEX "CallRecord_studentId_idx" ON "CallRecord"("studentId");

-- CreateIndex
CREATE INDEX "CallRecord_startedAt_idx" ON "CallRecord"("startedAt");

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE INDEX "Appointment_teacherId_idx" ON "Appointment"("teacherId");

-- CreateIndex
CREATE INDEX "Appointment_studentId_idx" ON "Appointment"("studentId");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
