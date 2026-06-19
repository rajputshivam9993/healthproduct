import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../entities/appointment.entity';
import { AvailabilitySlot } from '../../entities/availability-slot.entity';
import { AppointmentStatus } from '../../entities/enums';
import { PaymentGatewayService } from './payment-gateway.service';

/**
 * Payments_Service — Razorpay webhook handling with signature verification
 * (Req 8.2, 8.6, 8.7), late-payment auto-refund (Req 8.8), and a dev helper to
 * simulate payment capture without real Razorpay credentials.
 */
@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
    @InjectRepository(AvailabilitySlot) private readonly slots: Repository<AvailabilitySlot>,
    private readonly gateway: PaymentGatewayService,
  ) {}

  /** Processes a Razorpay webhook after verifying its signature (Req 8.2, 8.6, 8.7). */
  async handleWebhook(
    rawBody: string,
    signature: string,
    event: { type: string; orderId: string; paymentId?: string },
  ): Promise<{ received: boolean }> {
    if (!this.gateway.verifyWebhookSignature(rawBody, signature)) {
      // Invalid signature: reject and do not mutate state (Req 8.7).
      throw new UnauthorizedException('Invalid webhook signature');
    }
    if (event.type === 'payment.captured' || event.type === 'payment.success') {
      await this.markPaid(event.orderId, event.paymentId ?? null);
    }
    // payment.failed: appointment stays PENDING_PAYMENT for retry (Req 8.3) — no-op.
    return { received: true };
  }

  /** Dev-only: simulate a successful capture for the caller's appointment. */
  async devConfirm(appointmentId: string, patientId: string): Promise<Appointment> {
    if (!this.gateway.isMock) {
      throw new ForbiddenException('Dev confirm is disabled when Razorpay is configured');
    }
    const appointment = await this.appointments.findOne({ where: { id: appointmentId } });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    if (appointment.patientId !== patientId) {
      throw new ForbiddenException('Not your appointment');
    }
    if (!appointment.razorpayOrderId) {
      throw new BadRequestException('No payment order for this appointment');
    }
    return this.markPaid(appointment.razorpayOrderId, `pay_dev_${appointmentId.slice(0, 8)}`);
  }

  /**
   * Marks the appointment behind an order as paid. If the slot was already
   * released/expired (appointment no longer PENDING_PAYMENT), auto-refund and keep
   * the current state (Req 8.8); otherwise transition to CONFIRMED (Req 8.2).
   */
  private async markPaid(orderId: string, paymentId: string | null): Promise<Appointment> {
    const appointment = await this.appointments.findOne({ where: { razorpayOrderId: orderId } });
    if (!appointment) {
      throw new NotFoundException('No appointment for this order');
    }

    if (appointment.status !== AppointmentStatus.PENDING_PAYMENT) {
      const refund = await this.gateway.refund(paymentId);
      appointment.razorpayPaymentId = paymentId;
      appointment.refundStatus = refund.status;
      return this.appointments.save(appointment);
    }

    appointment.status = AppointmentStatus.CONFIRMED;
    appointment.razorpayPaymentId = paymentId;
    return this.appointments.save(appointment);
  }
}
