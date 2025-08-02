import { SetMetadata } from '@nestjs/common';
import { EventType } from '../../../config/environment.enum';

export const LOG_EVENT_KEY = 'logEvent';

export interface LogEventMetadata {
  eventType: EventType;
  eventDataKey?: string; // Key in request body to extract event data
  includeUser?: boolean; // Whether to include user ID in the log
  includeRequest?: boolean; // Whether to include request metadata
}

export const LogEvent = (metadata: LogEventMetadata) => SetMetadata(LOG_EVENT_KEY, metadata); 