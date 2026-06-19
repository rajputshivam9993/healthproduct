import { IsDateString } from 'class-validator';

/** Date range for listing slots (Req 6.8 — max 30 days enforced in service). */
export class SlotRangeDto {
  @IsDateString({}, { message: 'from must be an ISO date' })
  from!: string;

  @IsDateString({}, { message: 'to must be an ISO date' })
  to!: string;
}
