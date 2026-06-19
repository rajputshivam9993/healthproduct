import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

/**
 * Admin doctor-registration payload (Req 2.1, 17.5). Sent as multipart/form-data
 * with an optional medical-document file, so numeric fields arrive as strings.
 */
export class RegisterDoctorDto {
  @IsString()
  @Length(1, 100, { message: 'name must be 1-100 characters' })
  name!: string;

  @IsEmail({}, { message: 'email must be valid' })
  email!: string;

  @Matches(/^\d{10}$/, { message: 'phone must be a 10-digit number' })
  phone!: string;

  @IsString()
  @Length(1, 500)
  address!: string;

  @IsString()
  @Length(1, 255)
  qualification!: string;

  @IsString()
  @Length(1, 255)
  degree!: string;

  @IsString()
  @Length(1, 100)
  medicalRegNumber!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  specialization?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  state?: string;

  @IsOptional()
  @Matches(/^-?\d{1,3}(\.\d+)?$/, { message: 'latitude must be a number' })
  latitude?: string;

  @IsOptional()
  @Matches(/^-?\d{1,3}(\.\d+)?$/, { message: 'longitude must be a number' })
  longitude?: string;
}
