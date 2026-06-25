import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';

import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { jwtConfig } from './config/jwt.config';
import { throttleConfig } from './config/throttle.config';
import { integrationsConfig } from './config/integrations.config';
import { loggerOptions } from './config/logger.config';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PatientsModule } from './modules/patients/patients.module';

/**
 * Root module. Wires configuration, the database connection, rate limiting, the
 * Winston logger, and registers the global guards/interceptor/filter that enforce
 * the cross-cutting security & validation requirements (Req 3, 15). All eight
 * feature modules (Req 14.6) are imported here.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, jwtConfig, throttleConfig, integrationsConfig],
    }),
    WinstonModule.forRoot(loggerOptions),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Dev mode: in-process sql.js database, schema auto-synchronized.
        if (config.get<string>('database.type') === 'sqlite') {
          return {
            type: 'sqljs',
            location: config.get<string>('database.sqliteFile'),
            autoSave: true,
            autoLoadEntities: true,
            synchronize: true,
          };
        }
        // Production: PostgreSQL + PostGIS, schema managed by migrations only.
        return {
          type: 'postgres',
          host: config.get<string>('database.host'),
          port: config.get<number>('database.port'),
          username: config.get<string>('database.username'),
          password: config.get<string>('database.password'),
          database: config.get<string>('database.database'),
          autoLoadEntities: true,
          synchronize: false,
          ssl: config.get<string>('database.ssl') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        };
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: (config.get<number>('throttle.ttl') ?? 60) * 1000,
            limit: config.get<number>('throttle.limit') ?? 100,
          },
        ],
      }),
    }),
    AuthModule,
    UsersModule,
    DoctorsModule,
    AppointmentsModule,
    PrescriptionsModule,
    PaymentsModule,
    ReviewsModule,
    NotificationsModule,
    AnalyticsModule,
    PatientsModule,
  ],
  providers: [
    // Rate limiting on all routes (Req 15.4).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // JWT auth then role check — order matters (auth populates request.user).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    // Correlation id on every request (Req 15.7).
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
    // Standardized error responses (Req 15.5).
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule { }
