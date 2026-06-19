import {
  Column,
  ColumnOptions,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VerificationStatus } from './enums';
import { enumColumn, numericColumn, timestampColumn } from './column-helpers';
import { isSqlite } from '../config/database.config';
import { User } from './user.entity';

// In Postgres the doctor location is a PostGIS geography point (enables ST_DWithin
// proximity search, Req 5). The dev SQLite database has no PostGIS, so the column
// degrades to plain text there (search is unavailable in dev mode).
const locationColumn: ColumnOptions = isSqlite
  ? { type: 'text', nullable: true }
  : { type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true };

/**
 * Professional profile for a DOCTOR user. The `location` column is a PostGIS
 * geography point (SRID 4326) enabling ST_DWithin / ST_Distance proximity search
 * (Req 5). Aggregate rating fields are denormalised for fast doctor listings.
 */
@Entity('doctor_profiles')
export class DoctorProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId!: string;

  @OneToOne(() => User, (user) => user.doctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialization!: string | null;

  @Column({ type: 'int', default: 0 })
  experienceYears!: number;

  @Column(numericColumn(8, 2, { nullable: true }))
  consultationFee!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qualification!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  degree!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  medicalRegNumber!: string | null;

  @Column({ type: 'text', nullable: true })
  clinicAddress!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  bio!: string | null;

  // lon/lat point. Spatial type + GIST index are created by the Postgres migration;
  // not declared as an entity @Index so the dev SQLite synchronize path stays valid.
  @Column(locationColumn)
  location!: string | null;

  // Plain lat/lng kept alongside the geography column so coordinates are readable
  // in both DB modes (the PostGIS `location` is derived from these for search).
  @Column(numericColumn(9, 6, { nullable: true }))
  latitude!: string | null;

  @Column(numericColumn(9, 6, { nullable: true }))
  longitude!: string | null;

  @Column({ type: 'text', nullable: true })
  documentUrl!: string | null;

  @Column(enumColumn(VerificationStatus, { default: VerificationStatus.PENDING }))
  verificationStatus!: VerificationStatus;

  @Column(numericColumn(2, 1, { default: 0 }))
  avgRating!: string;

  @Column({ type: 'int', default: 0 })
  totalReviews!: number;

  @CreateDateColumn(timestampColumn())
  createdAt!: Date;

  @UpdateDateColumn(timestampColumn())
  updatedAt!: Date;
}
