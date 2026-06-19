import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

/** Submit a review for a COMPLETED appointment (Req 11.1, 11.6). */
export class CreateReviewDto {
  @IsUUID()
  appointmentId!: string;

  @Type(() => Number)
  @IsInt({ message: 'rating must be an integer 1-5' })
  @Min(1, { message: 'rating must be between 1 and 5' })
  @Max(5, { message: 'rating must be between 1 and 5' })
  rating!: number;

  @IsOptional()
  @IsString()
  @Length(0, 1000, { message: 'comment must be at most 1000 characters' })
  comment?: string;
}
