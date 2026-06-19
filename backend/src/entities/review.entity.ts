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
import { timestampColumn } from './column-helpers';
import { Appointment } from './appointment.entity';
import { DoctorProfile } from './doctor-profile.entity';
import { User } from './user.entity';

/**
 * Post-consultation review (Req 11). One review per appointment (unique
 * appointmentId). Rating is an integer 1-5; persisting a review recalculates the
 * doctor's aggregate rating.
 */
@Entity('reviews')
@Index(['doctorId', 'createdAt'])
export class Review {
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

  @ManyToOne(() => DoctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor!: DoctorProfile;

  @Column({ type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patientId' })
  patient!: User;

  @Column({ type: 'smallint' })
  rating!: number;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  comment!: string | null;

  @CreateDateColumn(timestampColumn())
  createdAt!: Date;
}
