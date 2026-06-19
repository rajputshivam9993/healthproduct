import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from '../../entities/prescription.entity';
import { Appointment } from '../../entities/appointment.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';

/** PrescriptionsModule (Req 10). */
@Module({
  imports: [TypeOrmModule.forFeature([Prescription, Appointment, DoctorProfile])],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
