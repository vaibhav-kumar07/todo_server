import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from './email/email.service';
import { SeedService } from './database/seed.service';
import { WebSocketModule } from './websocket/websocket.module';
import { LoggingModule } from './logging/logging.module';
import { RedisModule } from './redis/redis.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Team, TeamSchema } from '../teams/schemas/team.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
    WebSocketModule,
    LoggingModule,
    RedisModule,
  ],
  providers: [EmailService, SeedService],
  exports: [EmailService, SeedService, WebSocketModule, LoggingModule, RedisModule],
})
export class SharedModule {} 