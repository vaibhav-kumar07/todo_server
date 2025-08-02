import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EventLoggerService } from '../services/event-logger.service';
import { LOG_EVENT_KEY, LogEventMetadata } from '../decorators/log-event.decorator';
import { EventType } from '../../../config/environment.enum';

@Injectable()
export class EventLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly eventLoggerService: EventLoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logEventMetadata = this.reflector.get<LogEventMetadata>(
      LOG_EVENT_KEY,
      context.getHandler(),
    );

    if (!logEventMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (data) => {
        try {
          const eventData = this.extractEventData(request, logEventMetadata);
          const metadata = this.extractMetadata(request, response, startTime, logEventMetadata);
          const userId = this.extractUserId(request, logEventMetadata);

          await this.eventLoggerService.logEvent(
            logEventMetadata.eventType,
            eventData,
            metadata,
            userId,
          );
        } catch (error) {
          // Don't let logging errors affect the main application flow
          console.error('Event logging failed:', error);
        }
      }),
    );
  }

  private extractEventData(request: any, metadata: LogEventMetadata): any {
    if (metadata.eventDataKey && request.body) {
      return request.body[metadata.eventDataKey] || request.body;
    }
    return request.body || {};
  }

  private extractMetadata(
    request: any,
    response: any,
    startTime: number,
    metadata: LogEventMetadata,
  ): any {
    const baseMetadata: any = {
      ip: request.ip || request.connection?.remoteAddress,
      userAgent: request.headers['user-agent'],
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration: Date.now() - startTime,
    };

    if (metadata.includeRequest) {
      baseMetadata.requestId = request.headers['x-request-id'];
      baseMetadata.sessionId = request.session?.id;
    }

    return baseMetadata;
  }

  private extractUserId(request: any, metadata: LogEventMetadata): string | undefined {
    if (!metadata.includeUser) {
      return undefined;
    }

    // Try to get user ID from different sources
    return (
      request.user?.id ||
      request.user?._id ||
      request.user?.userId ||
      request.headers['x-user-id']
    );
  }
} 