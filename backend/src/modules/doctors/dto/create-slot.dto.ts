import { IsDateString, IsEnum } from 'class-validator';
import { ConsultationType } from '../../../entities/enums';

/** Create an availability slot (Req 6.1, 6.2). Times are ISO 8601 datetimes. */
export class CreateSlotDto {
  @IsDateString({}, { message: 'startTime must be an ISO datetime' })
  startTime!: string;

  @IsDateString({}, { message: 'endTime must be an ISO datetime' })
  endTime!: string;

  @IsEnum(ConsultationType)
  consultationType!: ConsultationType;
}
