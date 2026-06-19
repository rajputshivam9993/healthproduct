import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/** UsersModule (Req 4). */
@Module({
  imports: [TypeOrmModule.forFeature([User, DoctorProfile])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
