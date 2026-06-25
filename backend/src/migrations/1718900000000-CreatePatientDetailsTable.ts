import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the patient_details table and adds a patientDetailId FK column to
 * the appointments table so bookings can reference a specific patient profile.
 */
export class CreatePatientDetailsTable1718900000000 implements MigrationInterface {
  name = 'CreatePatientDetailsTable1718900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the gender enum type if it doesn't already exist
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'patient_details_gender_enum') THEN
          CREATE TYPE "patient_details_gender_enum" AS ENUM ('MALE', 'FEMALE', 'OTHER');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE "patient_details" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "age" integer NOT NULL,
        "gender" "patient_details_gender_enum" NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_patient_details" PRIMARY KEY ("id"),
        CONSTRAINT "FK_patient_details_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_patient_details_userId" ON "patient_details" ("userId");
    `);

    // Add patientDetailId column to appointments
    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD COLUMN "patientDetailId" uuid;
    `);

    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD CONSTRAINT "FK_appointments_patientDetail" FOREIGN KEY ("patientDetailId")
          REFERENCES "patient_details"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_appointments_patientDetail";`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "patientDetailId";`);
    await queryRunner.query(`DROP INDEX "IDX_patient_details_userId";`);
    await queryRunner.query(`DROP TABLE "patient_details";`);
    await queryRunner.query(`DROP TYPE "patient_details_gender_enum";`);
  }
}
