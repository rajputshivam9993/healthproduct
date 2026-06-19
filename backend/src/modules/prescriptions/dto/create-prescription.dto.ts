import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

/** One medication line (Req 10.1). */
export class MedicationDto {
  @IsString()
  @Length(1, 200)
  name!: string;

  @IsString()
  @Length(1, 100)
  dosage!: string;

  @IsString()
  @Length(1, 100)
  frequency!: string;

  @IsString()
  @Length(1, 100)
  duration!: string;
}

/** Create a prescription for a COMPLETED appointment (Req 10.1). */
export class CreatePrescriptionDto {
  @IsUUID()
  appointmentId!: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'at least one medication is required' })
  @ArrayMaxSize(20, { message: 'at most 20 medications are allowed' })
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medications!: MedicationDto[];

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;
}
