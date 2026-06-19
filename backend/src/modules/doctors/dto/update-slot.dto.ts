import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ConsultationType } from '../../../entities/enums';

/** Update an availability slot (Req 6.3). All fields optional. */
export class UpdateSlotDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsEnum(ConsultationType)
  consultationType?: ConsultationType;
}
