import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

/** Body for admin credential login (Req 17.2). */
export class AdminLoginDto {
  @IsEmail({}, { message: 'email must be valid' })
  email!: string;

  @IsString()
  @Length(1, 128)
  password!: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  deviceId?: string;
}
