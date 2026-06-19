import { IsOptional, IsString } from 'class-validator';

/** Simplified Razorpay webhook payload (Req 8.2). */
export class WebhookDto {
  @IsString()
  type!: string;

  @IsString()
  orderId!: string;

  @IsOptional()
  @IsString()
  paymentId?: string;
}
