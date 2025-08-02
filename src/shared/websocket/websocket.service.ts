import { Injectable, Logger } from '@nestjs/common';
import { TasksWebSocketGateway } from './websocket.gateway';

export const TASK_EVENTS = {
  ASSIGNED: 'task:assigned',
  UPDATED: 'task:updated',
  CREATED: 'task:created',
  DELETED: 'task:deleted',
  STATUS_CHANGED: 'task:status-changed',
} as const;

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  TASK_CREATED: 'task_created',
  TASK_DELETED: 'task_deleted',
  STATUS_CHANGED: 'status_changed',
} as const;

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger('WebSocketService');

  constructor(private readonly webSocketGateway: TasksWebSocketGateway) {}

  // Emit task events to specific users or teams
  emitTaskEvent(event: string, data: any, target?: { userId?: string; teamId?: string }) {
    try {
      if (target?.userId) {
        // Emit to specific user
        this.webSocketGateway.server.to(`user-${target.userId}`).emit(event, {
          ...data,
          timestamp: new Date().toISOString(),
        });
        this.logger.log(`Emitted ${event} to user ${target.userId}`);
      } else if (target?.teamId) {
        // Emit to team
        this.webSocketGateway.server.to(`team-${target.teamId}`).emit(event, {
          ...data,
          timestamp: new Date().toISOString(),
        });
        this.logger.log(`Emitted ${event} to team ${target.teamId}`);
      } else {
        // Emit to all connected clients
        this.webSocketGateway.server.emit(event, {
          ...data,
          timestamp: new Date().toISOString(),
        });
        this.logger.log(`Emitted ${event} to all clients`);
      }
    } catch (error) {
      this.logger.error(`Error emitting ${event}:`, error);
    }
  }

  // Task assignment notification
  emitTaskAssigned(task: any, assignedToUserId: string) {
    this.emitTaskEvent(TASK_EVENTS.ASSIGNED, {
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      task,
      message: `You have been assigned a new task: ${task.title}`,
    }, { userId: assignedToUserId });
  }

  // Task status change notification
  emitTaskStatusChanged(task: any, previousStatus: string, newStatus: string, teamId: string) {
    this.emitTaskEvent(TASK_EVENTS.STATUS_CHANGED, {
      type: NOTIFICATION_TYPES.STATUS_CHANGED,
      task,
      previousStatus,
      newStatus,
      message: `Task "${task.title}" status changed from ${previousStatus} to ${newStatus}`,
    }, { teamId });
  }

  // Task creation notification
  emitTaskCreated(task: any, teamId: string) {
    this.emitTaskEvent(TASK_EVENTS.CREATED, {
      type: NOTIFICATION_TYPES.TASK_CREATED,
      task,
      message: `New task created: ${task.title}`,
    }, { teamId });
  }

  // Task update notification
  emitTaskUpdated(task: any, teamId: string) {
    this.emitTaskEvent(TASK_EVENTS.UPDATED, {
      type: NOTIFICATION_TYPES.TASK_UPDATED,
      task,
      message: `Task updated: ${task.title}`,
    }, { teamId });
  }

  // Task deletion notification
  emitTaskDeleted(taskId: string, taskTitle: string, teamId: string) {
    this.emitTaskEvent(TASK_EVENTS.DELETED, {
      type: NOTIFICATION_TYPES.TASK_DELETED,
      taskId,
      taskTitle,
      message: `Task deleted: ${taskTitle}`,
    }, { teamId });
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.webSocketGateway.server.sockets.sockets.size;
  }

  // Get server instance for advanced operations
  getServer() {
    return this.webSocketGateway.server;
  }
} 