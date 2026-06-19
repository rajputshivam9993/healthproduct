import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { UserStatus } from '../../../entities/enums';

/** Query params for the admin doctor list (Req 17.6). */
export class ListDoctorsDto {
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  // Free-text search over name / phone.
  @IsOptional()
  @IsString()
  search?: string;

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
