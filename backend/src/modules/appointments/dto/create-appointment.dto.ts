import { IsUUID } from 'class-validator';

/** Patient booking request (Req 7.1) — selects an available slot. */
export class CreateAppointmentDto {
  @IsUUID()
  slotId!: string;
}
