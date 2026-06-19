import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

/** Header carrying the per-request correlation id (Req 15.7). */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Generates (or honours an inbound) request id at ingress, stores it on the
 * request for downstream logging, and echoes it in the response header so clients
 * can correlate (Req 15.7).
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { requestId?: string }>();
    const response = http.getResponse<Response>();

    const incoming = request.headers[REQUEST_ID_HEADER];
    const requestId = (Array.isArray(incoming) ? incoming[0] : incoming) ?? uuidv4();

    request.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    return next.handle();
  }
}
