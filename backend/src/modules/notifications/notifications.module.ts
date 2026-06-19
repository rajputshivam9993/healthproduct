import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../../entities/notification.entity';
import { Chat } from '../../entities/chat.entity';
import { Appointment } from '../../entities/appointment.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

/** NotificationsModule (Req 12, 13). */
@Module({
  imports: [TypeOrmModule.forFeature([Notification, Chat, Appointment, DoctorProfile])],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}
