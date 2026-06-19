import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/enums';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { ListPrescriptionsDto } from './dto/list-prescriptions.dto';

/** Prescription endpoints (Req 10). */
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Roles(UserRole.DOCTOR)
  @Post()
  create(@CurrentUser('id') doctorUserId: string, @Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(doctorUserId, dto);
  }

  @Roles(UserRole.PATIENT)
  @Get()
  myHistory(@CurrentUser('id') patientId: string, @Query() query: ListPrescriptionsDto) {
    return this.prescriptionsService.listForPatient(patientId, query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.prescriptionsService.getOne(id, user);
  }
}
