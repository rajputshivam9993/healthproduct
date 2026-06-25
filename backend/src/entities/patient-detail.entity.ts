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
import { Gender } from './enums';
import { enumColumn, timestampColumn } from './column-helpers';
import { User } from './user.entity';

/**
 * Stores patient details (name, age, gender) for appointment bookings.
 * A single user can have multiple patient profiles (self, family members, etc.).
 */
@Entity('patient_details')
@Index(['userId'])
export class PatientDetail {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'int' })
  age!: number;

  @Column(enumColumn(Gender))
  gender!: Gender;

  @CreateDateColumn(timestampColumn())
  createdAt!: Date;

  @UpdateDateColumn(timestampColumn())
  updatedAt!: Date;
}
