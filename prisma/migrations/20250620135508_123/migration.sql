-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('UPCOMING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('ONLINE', 'TEACHER_HOME', 'STUDENT_HOME');

-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('MATEMATYKA', 'INF02');

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'UPCOMING',
    "type" "AppointmentType" NOT NULL,
    "subject" "Subject" NOT NULL,
    "price" INTEGER NOT NULL,
    "notes" TEXT,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
