import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Appointment } from '../../entities/appointment.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

/** AnalyticsModule (Req 17.11, 19.5). */
@Module({
  imports: [TypeOrmModule.forFeature([User, Appointment])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
