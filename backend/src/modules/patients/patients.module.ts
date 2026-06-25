import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientDetail } from '../../entities/patient-detail.entity';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

/** PatientsModule — manages patient detail records for booking. */
@Module({
  imports: [TypeOrmModule.forFeature([PatientDetail])],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
