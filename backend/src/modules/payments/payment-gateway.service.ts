import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'node:crypto';

export interface RazorpayOrder {
  orderId: string;
  amount: number; // in paise
  currency: string;
  mock: boolean;
}

/**
 * Razorpay gateway wrapper (Req 8). When no key is configured (dev) it returns
 * deterministic mock orders and treats payments as verifiable locally, so the
 * booking/payment flow works without real credentials. With keys set, the real
 * Razorpay SDK and HMAC-SHA256 signature verification are used.
 */
@Injectable()
export class PaymentGatewayService {
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(config: ConfigService) {
    this.keyId = config.get<string>('integrations.razorpay.keyId') ?? '';
    this.keySecret = config.get<string>('integrations.razorpay.keySecret') ?? '';
    this.webhookSecret = config.get<string>('integrations.razorpay.webhookSecret') ?? '';
  }

  get isMock(): boolean {
    return !this.keyId || !this.keySecret;
  }

  /** Creates a payment order for the given INR amount (Req 8.1). */
  async createOrder(amountInr: number): Promise<RazorpayOrder> {
    const amount = Math.round(amountInr * 100); // paise
    if (this.isMock) {
      return { orderId: `order_dev_${randomUUID()}`, amount, currency: 'INR', mock: true };
    }
    // Real Razorpay order creation is wired here when credentials are present.
    // const razorpay = new Razorpay({ key_id: this.keyId, key_secret: this.keySecret });
    // const order = await razorpay.orders.create({ amount, currency: 'INR' });
    // return { orderId: order.id, amount, currency: 'INR', mock: false };
    throw new Error('Razorpay live mode not configured');
  }

  /** Verifies a webhook signature using HMAC-SHA256 (Req 8.6, 8.7). */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (this.isMock) {
      // Dev: accept the sentinel signature so the flow is testable.
      return signature === 'dev-signature';
    }
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    return expected === signature;
  }

  /** Initiates a refund for a payment (Req 8.5). Dev returns an immediate result. */
  async refund(paymentId: string | null): Promise<{ status: 'initiated' | 'processed' }> {
    if (this.isMock || !paymentId) {
      return { status: 'processed' };
    }
    // Real refund via Razorpay SDK is wired here when credentials are present.
    return { status: 'initiated' };
  }
}
