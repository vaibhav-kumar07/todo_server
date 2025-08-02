import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AppConfigService } from './config/app.config.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly appConfigService: AppConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.appConfigService.getEnvironment(),
      port: this.appConfigService.getPort(),
      database: {
        uri: this.appConfigService.getDatabaseConfig().uri ? 'configured' : 'not configured',
      },
      websocket: {
        cors: this.appConfigService.getCorsConfig(),
        port: this.appConfigService.getWebSocketConfig().port,
      },
    };
  }

  @Get('websocket-status')
  getWebSocketStatus() {
    return {
      status: 'WebSocket Gateway is running',
      cors: this.appConfigService.getCorsConfig(),
      testClient: 'Open test/websocket-simple.html in your browser',
      events: [
        'task:assigned',
        'task:created', 
        'task:updated',
        'task:deleted',
        'task:status-changed',
      ],
      rooms: [
        'join-user-room',
        'join-team-room',
      ],
    };
  }
}
