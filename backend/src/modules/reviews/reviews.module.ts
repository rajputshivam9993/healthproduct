import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../../entities/review.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { Appointment } from '../../entities/appointment.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

/** ReviewsModule (Req 11). */
@Module({
  imports: [TypeOrmModule.forFeature([Review, DoctorProfile, Appointment])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
