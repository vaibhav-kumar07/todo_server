import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app.config.service';

@WebSocketGateway({
  cors: {
    origin: true, // Allow all origins for initial connection
    credentials: true,
  },
})
export class TasksWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly appConfigService: AppConfigService) {}

  @WebSocketServer()
  server: Server;

  private logger = new Logger('WebSocketGateway');
  private connectedUsers = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.logger.log(`✅ Client connected: ${client.id}`);
    this.connectedUsers.set(client.id, client);
    
    // Send welcome message
    client.emit('welcome', { 
      message: 'Welcome to Task Management WebSocket!',
      socketId: client.id,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    return { event: 'joined-room', room };
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
    return { event: 'left-room', room };
  }

  @SubscribeMessage('join-user-room')
  handleJoinUserRoom(client: Socket, userId: string) {
    client.join(`user-${userId}`);
    this.logger.log(`Client ${client.id} joined user room: user-${userId}`);
    return { event: 'joined-user-room', userId };
  }

  @SubscribeMessage('join-team-room')
  handleJoinTeamRoom(client: Socket, teamId: string) {
    client.join(`team-${teamId}`);
    this.logger.log(`Client ${client.id} joined team room: team-${teamId}`);
    return { event: 'joined-team-room', teamId };
  }
} 