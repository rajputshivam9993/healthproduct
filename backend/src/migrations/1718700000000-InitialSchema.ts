import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial Doctor360 schema (Req 14.4). Enables PostGIS, creates all enum types,
 * the eight core tables with their foreign keys and constraints, a GIST spatial
 * index on doctor location, and supporting lookup indexes. Runs against a fresh
 * PostgreSQL instance with the PostGIS extension available.
 */
export class InitialSchema1718700000000 implements MigrationInterface {
  name = 'InitialSchema1718700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Spatial extension required for the doctor location column / proximity search.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    // ---- Enum types ----
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');`);
    await queryRunner.query(`CREATE TYPE "users_status_enum" AS ENUM ('ACTIVE', 'INACTIVE');`);
    await queryRunner.query(`CREATE TYPE "users_gender_enum" AS ENUM ('MALE', 'FEMALE', 'OTHER');`);
    await queryRunner.query(
      `CREATE TYPE "doctor_profiles_verificationstatus_enum" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');`,
    );
    await queryRunner.query(`CREATE TYPE "consultation_type_enum" AS ENUM ('IN_PERSON', 'VIDEO');`);
    await queryRunner.query(
      `CREATE TYPE "appointments_status_enum" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');`,
    );
    await queryRunner.query(
      `CREATE TYPE "notifications_type_enum" AS ENUM ('APPOINTMENT_UPDATE', 'CHAT_MESSAGE', 'PAYMENT', 'SYSTEM');`,
    );

    // ---- users ----
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "phone" varchar(10) NOT NULL,
        "email" varchar(255),
        "role" "users_role_enum" NOT NULL,
        "status" "users_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "name" varchar(100),
        "dateOfBirth" date,
        "gender" "users_gender_enum",
        "bloodGroup" varchar(8),
        "allergies" text,
        "avatarUrl" text,
        "passwordHash" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      );
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_phone" ON "users" ("phone");`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email" ON "users" ("email") WHERE "email" IS NOT NULL;`,
    );

    // ---- doctor_profiles ----
    await queryRunner.query(`
      CREATE TABLE "doctor_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "specialization" varchar(100),
        "experienceYears" integer NOT NULL DEFAULT 0,
        "consultationFee" numeric(8,2),
        "qualification" varchar(255),
        "degree" varchar(255),
        "medicalRegNumber" varchar(100),
        "clinicAddress" text,
        "city" varchar(100),
        "state" varchar(100),
        "bio" varchar(2000),
        "location" geography(Point,4326),
        "latitude" numeric(9,6),
        "longitude" numeric(9,6),
        "documentUrl" text,
        "verificationStatus" "doctor_profiles_verificationstatus_enum" NOT NULL DEFAULT 'PENDING',
        "avgRating" numeric(2,1) NOT NULL DEFAULT 0,
        "totalReviews" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doctor_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_doctor_profiles_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_doctor_profiles_userId" ON "doctor_profiles" ("userId");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_doctor_profiles_location" ON "doctor_profiles" USING GIST ("location");`,
    );

    // ---- availability_slots ----
    await queryRunner.query(`
      CREATE TABLE "availability_slots" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "doctorId" uuid NOT NULL,
        "date" date NOT NULL,
        "startTime" timestamptz NOT NULL,
        "endTime" timestamptz NOT NULL,
        "consultationType" "consultation_type_enum" NOT NULL,
        "isBooked" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_availability_slots" PRIMARY KEY ("id"),
        CONSTRAINT "FK_availability_slots_doctor" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_availability_slots_doctor_date" ON "availability_slots" ("doctorId", "date");`,
    );

    // ---- appointments ----
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "patientId" uuid NOT NULL,
        "doctorId" uuid NOT NULL,
        "slotId" uuid NOT NULL,
        "status" "appointments_status_enum" NOT NULL DEFAULT 'PENDING_PAYMENT',
        "consultationType" "consultation_type_enum" NOT NULL,
        "scheduledStart" timestamptz NOT NULL,
        "scheduledEnd" timestamptz NOT NULL,
        "doctorNotes" text,
        "razorpayOrderId" text,
        "razorpayPaymentId" text,
        "refundStatus" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointments_patient" FOREIGN KEY ("patientId") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_appointments_doctor" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_appointments_slot" FOREIGN KEY ("slotId") REFERENCES "availability_slots" ("id") ON DELETE RESTRICT
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_doctor_status" ON "appointments" ("doctorId", "status");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_patient_status" ON "appointments" ("patientId", "status");`,
    );

    // ---- prescriptions ----
    await queryRunner.query(`
      CREATE TABLE "prescriptions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "appointmentId" uuid NOT NULL,
        "doctorId" uuid NOT NULL,
        "patientId" uuid NOT NULL,
        "medications" jsonb NOT NULL,
        "notes" varchar(1000),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_prescriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_prescriptions_appointment" FOREIGN KEY ("appointmentId") REFERENCES "appointments" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_prescriptions_doctor" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_prescriptions_patient" FOREIGN KEY ("patientId") REFERENCES "users" ("id") ON DELETE RESTRICT
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_prescriptions_appointmentId" ON "prescriptions" ("appointmentId");`,
    );

    // ---- reviews ----
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "appointmentId" uuid NOT NULL,
        "doctorId" uuid NOT NULL,
        "patientId" uuid NOT NULL,
        "rating" smallint NOT NULL,
        "comment" varchar(1000),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reviews_appointment" FOREIGN KEY ("appointmentId") REFERENCES "appointments" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_doctor" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_patient" FOREIGN KEY ("patientId") REFERENCES "users" ("id") ON DELETE RESTRICT
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_reviews_appointmentId" ON "reviews" ("appointmentId");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_doctor_createdAt" ON "reviews" ("doctorId", "createdAt");`,
    );

    // ---- chats ----
    await queryRunner.query(`
      CREATE TABLE "chats" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "appointmentId" uuid NOT NULL,
        "senderId" uuid NOT NULL,
        "recipientId" uuid NOT NULL,
        "content" varchar(2000) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chats" PRIMARY KEY ("id"),
        CONSTRAINT "FK_chats_appointment" FOREIGN KEY ("appointmentId") REFERENCES "appointments" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_chats_sender" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_chats_recipient" FOREIGN KEY ("recipientId") REFERENCES "users" ("id") ON DELETE RESTRICT
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_chats_appointment_createdAt" ON "chats" ("appointmentId", "createdAt");`,
    );

    // ---- notifications ----
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "type" "notifications_type_enum" NOT NULL,
        "title" varchar(255) NOT NULL,
        "payload" jsonb,
        "isRead" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_isRead" ON "notifications" ("userId", "isRead");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse dependency order.
    await queryRunner.query(`DROP TABLE "notifications";`);
    await queryRunner.query(`DROP TABLE "chats";`);
    await queryRunner.query(`DROP TABLE "reviews";`);
    await queryRunner.query(`DROP TABLE "prescriptions";`);
    await queryRunner.query(`DROP TABLE "appointments";`);
    await queryRunner.query(`DROP TABLE "availability_slots";`);
    await queryRunner.query(`DROP TABLE "doctor_profiles";`);
    await queryRunner.query(`DROP TABLE "users";`);

    await queryRunner.query(`DROP TYPE "notifications_type_enum";`);
    await queryRunner.query(`DROP TYPE "appointments_status_enum";`);
    await queryRunner.query(`DROP TYPE "consultation_type_enum";`);
    await queryRunner.query(`DROP TYPE "doctor_profiles_verificationstatus_enum";`);
    await queryRunner.query(`DROP TYPE "users_gender_enum";`);
    await queryRunner.query(`DROP TYPE "users_status_enum";`);
    await queryRunner.query(`DROP TYPE "users_role_enum";`);
  }
}
