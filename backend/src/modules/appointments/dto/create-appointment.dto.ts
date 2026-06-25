import { IsOptional, IsUUID } from 'class-validator';

/** Patient booking request (Req 7.1) — selects an available slot and optionally a patient detail. */
export class CreateAppointmentDto {
  @IsUUID()
  slotId!: string;

  @IsOptional()
  @IsUUID()
  patientDetailId?: string;
}
