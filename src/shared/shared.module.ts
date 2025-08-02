import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from './email/email.service';
import { SeedService } from './database/seed.service';
import { WebSocketModule } from './websocket/websocket.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Team, TeamSchema } from '../teams/schemas/team.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
    WebSocketModule,
  ],
  providers: [EmailService, SeedService],
  exports: [EmailService, SeedService, WebSocketModule],
})
export class SharedModule {} 