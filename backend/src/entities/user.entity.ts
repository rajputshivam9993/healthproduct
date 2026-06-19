import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gender, UserRole, UserStatus } from './enums';
import { enumColumn, timestampColumn } from './column-helpers';
import { DoctorProfile } from './doctor-profile.entity';

/**
 * Platform user. A single table backs patients, doctors, and admins, distinguished
 * by `role`. Patient-specific medical fields (dob/gender/bloodGroup/allergies) live
 * here; doctor-specific professional fields live in {@link DoctorProfile}.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 10 })
  phone!: string;

  @Index({ unique: true, where: 'email IS NOT NULL' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column(enumColumn(UserRole))
  role!: UserRole;

  @Column(enumColumn(UserStatus, { default: UserStatus.ACTIVE }))
  status!: UserStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: string | null;

  @Column(enumColumn(Gender, { nullable: true }))
  gender!: Gender | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  bloodGroup!: string | null;

  @Column({ type: 'text', nullable: true })
  allergies!: string | null;

  @Column({ type: 'text', nullable: true })
  avatarUrl!: string | null;

  // Set only for credential-based logins (admins, Req 17.2). Patients/doctors use OTP.
  @Column({ type: 'text', nullable: true })
  passwordHash!: string | null;

  @OneToOne(() => DoctorProfile, (profile) => profile.user)
  doctorProfile?: DoctorProfile;

  @CreateDateColumn(timestampColumn())
  createdAt!: Date;

  @UpdateDateColumn(timestampColumn())
  updatedAt!: Date;
}
