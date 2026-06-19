import { IsString, IsUUID, Length } from 'class-validator';

/** Send a chat message within an appointment (Req 13.1, 13.6). */
export class SendMessageDto {
  @IsUUID()
  appointmentId!: string;

  @IsString()
  @Length(1, 2000, { message: 'message must be 1-2000 characters' })
  content!: string;
}
