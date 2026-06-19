import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/enums';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';

/** Appointment endpoints (Req 7). Booking is patient-only; reads/cancel are participant-scoped. */
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(UserRole.PATIENT)
  @Post()
  book(@CurrentUser('id') patientId: string, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.book(patientId, dto.slotId);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListAppointmentsDto) {
    return this.appointmentsService.list(user, query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.getOne(id, user);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.cancel(id, user);
  }

  // ---- Video consultation (Req 9) ----
  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  start(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.start(id, user);
  }

  @Get(':id/agora-token')
  agoraToken(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.agoraToken(id, user);
  }

  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.complete(id, user);
  }
}
