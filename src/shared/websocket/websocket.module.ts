import { Module } from '@nestjs/common';
import { TasksWebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';
import { AppConfigModule } from '../../config/config.module';

@Module({
  imports: [AppConfigModule],
  providers: [TasksWebSocketGateway, WebSocketService],
  exports: [WebSocketService],
})
export class WebSocketModule {} 