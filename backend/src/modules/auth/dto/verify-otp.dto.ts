import { IsOptional, IsString, Matches, Length } from 'class-validator';

/** Body for verifying an OTP (Req 1.2, 2.7). */
export class VerifyOtpDto {
  @Matches(/^\d{10}$/, { message: 'phone must be a 10-digit number' })
  phone!: string;

  @Matches(/^\d{6}$/, { message: 'otp must be a 6-digit number' })
  otp!: string;

  // Device fingerprint to scope the refresh token (Req 3.3). Defaults server-side.
  @IsOptional()
  @IsString()
  @Length(1, 128)
  deviceId?: string;
}
