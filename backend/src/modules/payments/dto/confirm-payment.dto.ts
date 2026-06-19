import { IsUUID } from 'class-validator';

/** Dev-only payment confirmation (simulates a captured Razorpay payment). */
export class ConfirmPaymentDto {
  @IsUUID()
  appointmentId!: string;
}
