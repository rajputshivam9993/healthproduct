import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/enums';
import { WebhookDto } from './dto/webhook.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

/** Payment endpoints (Req 8): Razorpay webhook + a dev confirmation helper. */
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Body() body: WebhookDto,
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    // Prefer the raw body for HMAC; fall back to a stable serialization in dev.
    const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(body);
    return this.paymentsService.handleWebhook(raw, signature ?? '', {
      type: body.type,
      orderId: body.orderId,
      paymentId: body.paymentId,
    });
  }

  // Dev convenience: simulate a captured payment for the caller's appointment.
  @Roles(UserRole.PATIENT)
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  confirm(@CurrentUser('id') patientId: string, @Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.devConfirm(dto.appointmentId, patientId);
  }
}
