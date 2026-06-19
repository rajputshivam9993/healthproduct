import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { REQUEST_ID_HEADER } from '../interceptors/request-id.interceptor';

/**
 * Global exception filter (Req 15.5). Logs every unhandled exception with its
 * request-id via Winston and returns a standardized, user-safe error body that
 * never leaks stack traces, internal names, or database details.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = request.requestId ?? request.headers[REQUEST_ID_HEADER];

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { error, message } = this.describe(exception, status);

    // Honour a Retry-After hint carried by rate-limit / service-unavailable errors
    // (Req 1.4, 1.5, 1.7, 15.8).
    const retryAfter = (exception as { retryAfterSec?: number })?.retryAfterSec;
    if (typeof retryAfter === 'number') {
      response.setHeader('Retry-After', retryAfter);
    }

    this.logger.error(message, {
      requestId,
      statusCode: status,
      path: request.url,
      method: request.method,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json({ requestId, statusCode: status, error, message });
  }

  /** Derives a user-safe error label and message without exposing internals. */
  private describe(
    exception: unknown,
    status: number,
  ): { error: string; message: string } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : ((res as { message?: string | string[] }).message ?? exception.message);
      return {
        error: exception.name,
        message: Array.isArray(message) ? message.join(', ') : message,
      };
    }
    return {
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
    };
  }
}
