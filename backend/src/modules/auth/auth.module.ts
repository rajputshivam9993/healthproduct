import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { Specialization } from '../../entities/specialization.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SeedService } from './seed.service';
import { OtpStore } from './stores/otp.store';
import { RefreshTokenStore } from './stores/refresh-token.store';

/**
 * AuthModule (Req 1-3, 17.2). Registers the JWT signing config and exports
 * JwtModule so the global JwtAuthGuard can verify access tokens. The OTP and
 * refresh-token stores are in-memory in dev and Redis-backed in production.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, DoctorProfile, Specialization]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: { expiresIn: config.get<string>('jwt.accessTtl') },
      }),
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, SeedService, OtpStore, RefreshTokenStore],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
