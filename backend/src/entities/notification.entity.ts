import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationType } from './enums';
import { enumColumn, jsonColumn, timestampColumn } from './column-helpers';
import { User } from './user.entity';

/**
 * Persisted user notification (Req 12). Retained at least 90 days; `isRead`
 * tracks read/unread state. `payload` holds type-specific data as JSON.
 */
@Entity('notifications')
@Index(['userId', 'isRead'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column(enumColumn(NotificationType))
  type!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column(jsonColumn({ nullable: true }))
  payload!: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @CreateDateColumn(timestampColumn())
  createdAt!: Date;
}
