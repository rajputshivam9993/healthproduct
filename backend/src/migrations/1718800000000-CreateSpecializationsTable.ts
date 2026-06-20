import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the specializations lookup table and seeds it with the initial set of
 * specializations. Replaces the hard-coded constant so specializations can be
 * managed dynamically via the database.
 */
export class CreateSpecializationsTable1718800000000 implements MigrationInterface {
  name = 'CreateSpecializationsTable1718800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "specializations" (
        "id" SERIAL NOT NULL,
        "name" varchar(100) NOT NULL,
        "displayOrder" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_specializations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_specializations_name" UNIQUE ("name")
      );
    `);

    // Seed initial specializations
    const specializations = [
      'General Physician',
      'Cardiologist',
      'Dermatologist',
      'Pediatrician',
      'Gynecologist',
      'Orthopedic',
      'Neurologist',
      'Psychiatrist',
      'Dentist',
      'ENT Specialist',
      'Ophthalmologist',
      'Gastroenterologist',
      'Urologist',
      'Endocrinologist',
      'Pulmonologist',
    ];

    for (let i = 0; i < specializations.length; i++) {
      await queryRunner.query(
        `INSERT INTO "specializations" ("name", "displayOrder") VALUES ($1, $2)`,
        [specializations[i], i + 1],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "specializations";`);
  }
}
