import { Body, Controller, Get, Post } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/enums';
import { CreatePatientDetailDto } from './dto/create-patient-detail.dto';

/** Patient detail endpoints — lets patients store profiles for self/family members. */
@Controller('patient-details')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Roles(UserRole.PATIENT)
  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.patientsService.listByUser(userId);
  }

  @Roles(UserRole.PATIENT)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePatientDetailDto) {
    return this.patientsService.create(userId, dto);
  }
}
