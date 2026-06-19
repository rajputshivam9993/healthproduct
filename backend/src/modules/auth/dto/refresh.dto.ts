import { IsOptional, IsString, Length } from 'class-validator';

/** Body for rotating tokens with a refresh token (Req 3.1). */
export class RefreshDto {
  @IsString()
  @Length(1, 2048)
  refreshToken!: string;

  @IsOptional()
  @IsString()
  @Length(1, 128)
  deviceId?: string;
}
