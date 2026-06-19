import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../../entities/appointment.entity';
import { AvailabilitySlot } from '../../entities/availability-slot.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentGatewayService } from './payment-gateway.service';

/** PaymentsModule (Req 8). Exports the gateway so Appointments can create orders/refunds. */
@Module({
  imports: [TypeOrmModule.forFeature([Appointment, AvailabilitySlot])],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentGatewayService],
  exports: [PaymentsService, PaymentGatewayService],
})
export class PaymentsModule {}
