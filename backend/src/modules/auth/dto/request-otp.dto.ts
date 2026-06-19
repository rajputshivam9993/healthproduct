import { Matches } from 'class-validator';

/** Body for requesting an OTP (Req 1.1, 2.6). */
export class RequestOtpDto {
  // 10-digit Indian phone number, digits only, no country code.
  @Matches(/^\d{10}$/, { message: 'phone must be a 10-digit number' })
  phone!: string;
}
