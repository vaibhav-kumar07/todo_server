import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventLog, EventLogSchema } from './schemas/event-log.schema';
import { UserActivity, UserActivitySchema } from './schemas/user-activity.schema';
import { EventLoggerService } from './services/event-logger.service';
import { EventLoggingInterceptor } from './interceptors/event-logging.interceptor';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventLog.name, schema: EventLogSchema },
      { name: UserActivity.name, schema: UserActivitySchema },
    ]),
    RedisModule,
  ],
  providers: [EventLoggerService, EventLoggingInterceptor],
  exports: [EventLoggerService, EventLoggingInterceptor],
})
export class LoggingModule {} 