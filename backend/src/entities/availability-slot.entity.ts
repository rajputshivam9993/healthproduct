import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConsultationType } from './enums';
import { enumColumn, timestampColumn } from './column-helpers';
import { DoctorProfile } from './doctor-profile.entity';

/** A bookable time window for a doctor (Req 6). `isBooked` flips when an appointment claims it. */
@Entity('availability_slots')
@Index(['doctorId', 'date'])
export class AvailabilitySlot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  doctorId!: string;

  @ManyToOne(() => DoctorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor!: DoctorProfile;

  @Column({ type: 'date' })
  date!: string;

  @Column(timestampColumn())
  startTime!: Date;

  @Column(timestampColumn())
  endTime!: Date;

  @Column(enumColumn(ConsultationType))
  consultationType!: ConsultationType;

  @Column({ type: 'boolean', default: false })
  isBooked!: boolean;

  @CreateDateColumn(timestampColumn())
  createdAt!: Date;

  @UpdateDateColumn(timestampColumn())
  updatedAt!: Date;
}
