import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { timestampColumn } from './column-helpers';
import { Appointment } from './appointment.entity';
import { User } from './user.entity';

/** A chat message exchanged within an appointment context (Req 13). */
@Entity('chats')
@Index(['appointmentId', 'createdAt'])
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  appointmentId!: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment!: Appointment;

  @Column({ type: 'uuid' })
  senderId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'senderId' })
  sender!: User;

  @Column({ type: 'uuid' })
  recipientId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'recipientId' })
  recipient!: User;

  @Column({ type: 'varchar', length: 2000 })
  content!: string;

  @CreateDateColumn(timestampColumn())
  createdAt!: Date;
}
