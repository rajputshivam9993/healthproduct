import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { jsonColumn, timestampColumn } from './column-helpers';
import { Appointment } from './appointment.entity';
import { DoctorProfile } from './doctor-profile.entity';
import { User } from './user.entity';

/** A single medication line within a prescription's `medications` JSON array (Req 10.1). */
export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

/**
 * Digital prescription created by a doctor for a COMPLETED appointment. One
 * prescription per appointment (Req 10.6) — enforced by the unique appointmentId.
 */
@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  appointmentId!: string;

  @OneToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment!: Appointment;

  @Column({ type: 'uuid' })
  doctorId!: string;

  @ManyToOne(() => DoctorProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctorId' })
  doctor!: DoctorProfile;

  @Column({ type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patientId' })
  patient!: User;

  @Column(jsonColumn())
  medications!: Medication[];

  @Column({ type: 'varchar', length: 1000, nullable: true })
  notes!: string | null;

  @CreateDateColumn(timestampColumn())
  createdAt!: Date;
}
