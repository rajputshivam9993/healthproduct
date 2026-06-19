import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { Chat } from '../../entities/chat.entity';
import { Appointment } from '../../entities/appointment.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { AppointmentStatus, NotificationType } from '../../entities/enums';
import { NotificationsGateway } from './notifications.gateway';
import { ChatHistoryDto } from './dto/history.dto';

interface Participants {
  patientUserId: string;
  doctorUserId: string;
}

/**
 * Notifications_Service — persists and pushes notifications (Req 12) and chat
 * messages (Req 13) over Socket.io. FCM push is the fallback for offline users
 * (stubbed here until credentials are configured).
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    @InjectRepository(Chat) private readonly chats: Repository<Chat>,
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
    @InjectRepository(DoctorProfile) private readonly profiles: Repository<DoctorProfile>,
    private readonly gateway: NotificationsGateway,
  ) {}

  /** Persists a notification and pushes it to the user in real time (Req 12.1-12.3). */
  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    payload?: Record<string, unknown>,
  ): Promise<Notification> {
    const notification = await this.notifications.save(
      this.notifications.create({ userId, type, title, payload: payload ?? null, isRead: false }),
    );
    // Socket.io delivery; if the user is offline a real impl would send FCM (Req 12.2).
    this.gateway.emitToUser(userId, 'notification', notification);
    return notification;
  }

  listForUser(userId: string): Promise<Notification[]> {
    return this.notifications.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 100 });
  }

  /** Marks a notification read and acknowledges via Socket.io (Req 12.6). */
  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notifications.findOne({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    await this.notifications.save(notification);
    this.gateway.emitToUser(userId, 'notification:read', { id });
    return notification;
  }

  /** Sends a chat message to the appointment's other participant (Req 13.1-13.4, 13.7). */
  async sendMessage(senderId: string, appointmentId: string, content: string): Promise<Chat> {
    const { appointment, participants } = await this.loadContext(appointmentId, senderId);
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new ForbiddenException('Chat is not available for a cancelled appointment');
    }
    const recipientId =
      senderId === participants.patientUserId ? participants.doctorUserId : participants.patientUserId;

    const message = await this.chats.save(
      this.chats.create({ appointmentId, senderId, recipientId, content }),
    );
    this.gateway.emitToUser(recipientId, 'chat:message', message);
    await this.notify(recipientId, NotificationType.CHAT_MESSAGE, 'New message', {
      appointmentId,
      chatId: message.id,
    });
    return message;
  }

  /** Chronological chat history for participants (Req 13.5). */
  async history(appointmentId: string, userId: string, query: ChatHistoryDto): Promise<Chat[]> {
    await this.loadContext(appointmentId, userId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    return this.chats.find({
      where: { appointmentId },
      order: { createdAt: 'ASC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
  }

  /** Loads the appointment + its participant user ids, asserting access (Req 13.3). */
  private async loadContext(
    appointmentId: string,
    userId: string,
  ): Promise<{ appointment: Appointment; participants: Participants }> {
    const appointment = await this.appointments.findOne({ where: { id: appointmentId } });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    const doctorProfile = await this.profiles.findOne({ where: { id: appointment.doctorId } });
    const participants: Participants = {
      patientUserId: appointment.patientId,
      doctorUserId: doctorProfile?.userId ?? '',
    };
    if (userId !== participants.patientUserId && userId !== participants.doctorUserId) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }
    return { appointment, participants };
  }
}
