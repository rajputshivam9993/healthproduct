// Load .env BEFORE any other import so entity column types that branch on
// DB_TYPE (e.g. PostGIS geography vs text) resolve correctly at import time.
import 'dotenv/config';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './common/upload/file-storage';

/**
 * Application bootstrap. Applies the security & validation middleware required by
 * Req 15: Helmet headers, a global ValidationPipe (class-validator/transformer),
 * and CORS. The request-id interceptor, rate limiter, exception filter, and auth
 * guards are registered globally in AppModule.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  // Route Nest logs through Winston so every log line is structured & correlatable.
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Serve uploaded medical documents / avatars in dev (S3 in production).
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads/' });

  const config = app.get(ConfigService);

  // Security headers on all responses (Req 15.3).
  app.use(helmet());

  // CORS for the mobile app and admin portal.
  const origins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins.length > 0 ? origins : true, credentials: true });

  // Validate & transform all request bodies (Req 15.1).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      // Validation failures return 422 with field errors (Req 5.6, 15.6).
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  app.setGlobalPrefix('api');

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

void bootstrap();
