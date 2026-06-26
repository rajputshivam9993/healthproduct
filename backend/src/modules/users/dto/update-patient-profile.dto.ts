import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Gender } from '../../../entities/enums';

/** Patient self-service profile update (Req 4.1). */
export class UpdatePatientProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth must be in YYYY-MM-DD format' })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  @Length(0, 8)
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  allergies?: string;
}
