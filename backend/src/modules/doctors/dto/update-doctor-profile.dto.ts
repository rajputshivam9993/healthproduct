import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

/** Doctor self-service profile update (Req 4.2, 21.6). All fields optional (patch). */
export class UpdateDoctorProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  specialization?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(70)
  experienceYears?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(100)
  @Max(99999)
  consultationFee?: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  clinicAddress?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  bio?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}
