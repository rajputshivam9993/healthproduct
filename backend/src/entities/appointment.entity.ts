import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppointmentStatus, ConsultationType } from './enums';
import { enumColumn, timestampColumn } from './column-helpers';
import { AvailabilitySlot } from './availability-slot.entity';
import { DoctorProfile } from './doctor-profile.entity';
import { PatientDetail } from './patient-detail.entity';
import { Prescription } from './prescription.entity';
import { Review } from './review.entity';
import { User } from './user.entity';

/**
 * A booked consultation. The primary key UUID doubles as the Agora channel name
 * for video consultations (Req 7.3). Status moves through the lifecycle defined
 * in Req 7.4.
 */
@Entity('appointments')
@Index(['doctorId', 'status'])
@Index(['patientId', 'status'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patientId' })
  patient!: User;

  @Column({ type: 'uuid' })
  doctorId!: string;

  @ManyToOne(() => DoctorProfile, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctorId' })
  doctor!: DoctorProfile;

  @Column({ type: 'uuid' })
  slotId!: string;

  @ManyToOne(() => AvailabilitySlot, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'slotId' })
  slot!: AvailabilitySlot;

  @Column({ type: 'uuid', nullable: true })
  patientDetailId!: string | null;

  @ManyToOne(() => PatientDetail, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'patientDetailId' })
  patientDetail!: PatientDetail | null;

  @Column(enumColumn(AppointmentStatus, { default: AppointmentStatus.PENDING_PAYMENT }))
  status!: AppointmentStatus;

  @Column(enumColumn(ConsultationType))
  consultationType!: ConsultationType;

  @Column(timestampColumn())
  scheduledStart!: Date;

  @Column(timestampColumn())
  scheduledEnd!: Date;

  @Column({ type: 'text', nullable: true })
  doctorNotes!: string | null;

  // Payment correlation (Req 8). The order id links a Razorpay webhook to this
  // appointment; refundStatus tracks the refund lifecycle on cancellation.
  @Column({ type: 'text', nullable: true })
  razorpayOrderId!: string | null;

  @Column({ type: 'text', nullable: true })
  razorpayPaymentId!: string | null;

  @Column({ type: 'text', nullable: true })
  refundStatus!: string | null;

  @OneToOne(() => Review, (review) => review.appointment, { nullable: true })
  review?: Review | null;

  @OneToOne(() => Prescription, (prescription) => prescription.appointment, { nullable: true })
  prescription?: Prescription | null;

  @CreateDateColumn(timestampColumn())
  createdAt!: Date;

  @UpdateDateColumn(timestampColumn())
  updatedAt!: Date;
}
