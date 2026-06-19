import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatHistoryDto } from './dto/history.dto';

/** Notification + chat REST endpoints (Req 12, 13). Real-time delivery is via Socket.io. */
@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  list(@CurrentUser('id') userId: string) {
    return this.notificationsService.listForUser(userId);
  }

  @Patch('notifications/:id/read')
  markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.markRead(id, userId);
  }

  @Post('chats')
  send(@CurrentUser('id') userId: string, @Body() dto: SendMessageDto) {
    return this.notificationsService.sendMessage(userId, dto.appointmentId, dto.content);
  }

  @Get('chats/:appointmentId')
  history(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser('id') userId: string,
    @Query() query: ChatHistoryDto,
  ) {
    return this.notificationsService.history(appointmentId, userId, query);
  }
}
