import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { Specialization } from '../../entities/specialization.entity';
import { AvailabilitySlot } from '../../entities/availability-slot.entity';
import { Review } from '../../entities/review.entity';
import { User } from '../../entities/user.entity';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

/** DoctorsModule (Req 4.2, 5, 6, 17.6, 17.7). */
@Module({
  imports: [TypeOrmModule.forFeature([DoctorProfile, Specialization, AvailabilitySlot, Review, User])],
  controllers: [DoctorsController, SlotsController],
  providers: [DoctorsService, SlotsService],
  exports: [DoctorsService, SlotsService],
})
export class DoctorsModule {}
