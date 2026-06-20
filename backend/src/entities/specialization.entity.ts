import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { timestampColumn } from './column-helpers';

/**
 * Specialization lookup table. Stores the canonical list of doctor specializations
 * used for registration, profile updates, and the patient search filter. Managed
 * via migrations/seed rather than hard-coded constants.
 */
@Entity('specializations')
export class Specialization {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  /** Controls display order in the app (lower = first). */
  @Column({ type: 'int', default: 0 })
  displayOrder!: number;

  /** Soft-disable a specialization without deleting it. */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn(timestampColumn())
  createdAt!: Date;
}
