import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

/** Query params for patient doctor search (Req 5.1, 5.5, 5.6). */
export class SearchDoctorsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90, { message: 'latitude must be between -90 and 90' })
  @Max(90, { message: 'latitude must be between -90 and 90' })
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180, { message: 'longitude must be between -180 and 180' })
  @Max(180, { message: 'longitude must be between -180 and 180' })
  longitude!: number;

  // Search radius in km (Req 5.1): min 1, default 10, max 50.
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'radius must be between 1 and 50 km' })
  @Max(50, { message: 'radius must be between 1 and 50 km' })
  radiusKm?: number = 10;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 20;
}
