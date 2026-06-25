import { IsEnum, IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { Gender } from '../../../entities/enums';

/** DTO for creating a new patient detail record. */
export class CreatePatientDetailDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsInt()
  @Min(0)
  @Max(150)
  age!: number;

  @IsEnum(Gender)
  gender!: Gender;
}
