import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../../entities/appointment.entity';
import { AvailabilitySlot } from '../../entities/availability-slot.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { PaymentsModule } from '../payments/payments.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AgoraService } from './agora.service';

/** AppointmentsModule (Req 7, 9). Imports PaymentsModule for order creation/refunds. */
@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, AvailabilitySlot, DoctorProfile]),
    PaymentsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AgoraService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
