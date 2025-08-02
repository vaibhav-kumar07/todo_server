import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventType } from '../../../config/environment.enum';
import { EventLog, EventLogDocument } from '../schemas/event-log.schema';
import { UserActivity, UserActivityDocument } from '../schemas/user-activity.schema';
import { RedisService } from '../../redis/redis.service';
import { EventMetadata, EventData } from '../interfaces/event.interface';

@Injectable()
export class EventLoggerService {
  private readonly logger = new Logger(EventLoggerService.name);

  constructor(
    @InjectModel(EventLog.name) private eventLogModel: Model<EventLogDocument>,
    @InjectModel(UserActivity.name) private userActivityModel: Model<UserActivityDocument>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Log an event asynchronously to avoid blocking the main application flow
   */
  async logEvent(
    eventType: EventType,
    eventData: EventData,
    metadata: EventMetadata,
    userId?: string,
  ): Promise<void> {
    try {
      const eventLog = new this.eventLogModel({
        userId: userId ? userId : undefined,
        eventType,
        eventData,
        metadata,
        timestamp: new Date(),
      });

      // Save to MongoDB asynchronously
      await eventLog.save();

      // Update Redis analytics counters asynchronously
      this.updateAnalyticsCounters(eventType, eventData, userId).catch(error => {
        this.logger.error('Failed to update analytics counters:', error);
      });

      // Log user activity if userId is provided
      if (userId) {
        const userActivity = new this.userActivityModel({
          userId,
          eventType,
          eventData,
          metadata,
          timestamp: new Date(),
        });

        await userActivity.save();
      }


    } catch (error) {
      this.logger.error(`Failed to log event ${eventType}:`, error);
      // Don't throw error to avoid breaking the main application flow
    }
  }

  /**
   * Update Redis analytics counters for real-time dashboard
   */
  private async updateAnalyticsCounters(
    eventType: EventType,
    eventData: EventData,
    userId?: string,
  ): Promise<void> {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    try {
      // Global event counters
      await this.redisService.increment(`analytics:events:${eventType}:total`);
      await this.redisService.increment(`analytics:events:${eventType}:${dateKey}`);

      // User-specific counters
      if (userId) {
        await this.redisService.increment(`user:${userId}:events:${eventType}:total`);
        await this.redisService.increment(`user:${userId}:events:${eventType}:${dateKey}`);
        await this.redisService.sadd(`analytics:active_users:${dateKey}`, userId);
      }

      // Task-specific analytics
      if (eventType.includes('TASK_')) {
        await this.updateTaskAnalytics(eventType, eventData, userId);
      }

      // User-specific analytics
      if (eventType.includes('USER_')) {
        await this.updateUserAnalytics(eventType, eventData, userId);
      }

      // Security analytics
      if (eventType.includes('SECURITY_')) {
        await this.updateSecurityAnalytics(eventType, eventData);
      }

      // Admin analytics
      if (eventType.includes('ADMIN_')) {
        await this.updateAdminAnalytics(eventType, eventData);
      }

    } catch (error) {
      this.logger.error('Failed to update analytics counters:', error);
    }
  }

  /**
   * Update task-related analytics
   */
  private async updateTaskAnalytics(
    eventType: EventType,
    eventData: EventData,
    userId?: string,
  ): Promise<void> {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];

    try {
      // Task status counters
      if (eventType === EventType.TASK_CREATED) {
        await this.redisService.increment('analytics:tasks:total');
        await this.redisService.increment(`analytics:tasks:${dateKey}`);
        
        if (userId) {
          await this.redisService.increment(`user:${userId}:tasks:created`);
        }
      }

      if (eventType === EventType.TASK_STATUS_CHANGED) {
        const newStatus = eventData.newStatus;
        if (newStatus) {
          await this.redisService.increment(`analytics:tasks:by_status:${newStatus}`);
          
          if (newStatus === 'DONE') {
            await this.redisService.increment('analytics:tasks:completed');
            if (userId) {
              await this.redisService.increment(`user:${userId}:tasks:completed`);
            }
          }
        }
      }

      if (eventType === EventType.TASK_ASSIGNED) {
        const assignedTo = eventData.assignedTo;
        if (assignedTo) {
          await this.redisService.increment(`user:${assignedTo}:tasks:assigned`);
        }
      }

    } catch (error) {
      this.logger.error('Failed to update task analytics:', error);
    }
  }

  /**
   * Update user-related analytics
   */
  private async updateUserAnalytics(
    eventType: EventType,
    eventData: EventData,
    userId?: string,
  ): Promise<void> {
    try {
      if (eventType === EventType.USER_LOGIN) {
        await this.redisService.increment('analytics:users:logins');
        if (userId) {
          await this.redisService.sadd('analytics:active_users', userId);
        }
      }

      if (eventType === EventType.USER_REGISTER) {
        await this.redisService.increment('analytics:users:registrations');
      }

    } catch (error) {
      this.logger.error('Failed to update user analytics:', error);
    }
  }

  /**
   * Update security-related analytics
   */
  private async updateSecurityAnalytics(
    eventType: EventType,
    eventData: EventData,
  ): Promise<void> {
    try {
      if (eventType === EventType.SECURITY_FAILED_LOGIN) {
        await this.redisService.increment('analytics:security:failed_logins');
        
        const ip = eventData.ip;
        if (ip) {
          await this.redisService.increment(`analytics:security:failed_logins:ip:${ip}`);
        }
      }

      if (eventType === EventType.SECURITY_SUSPICIOUS_ACTIVITY) {
        await this.redisService.increment('analytics:security:suspicious_activities');
      }

    } catch (error) {
      this.logger.error('Failed to update security analytics:', error);
    }
  }

  /**
   * Update admin-related analytics
   */
  private async updateAdminAnalytics(
    eventType: EventType,
    eventData: EventData,
  ): Promise<void> {
    try {
      if (eventType === EventType.ADMIN_USER_CREATED) {
        await this.redisService.increment('analytics:admin:users_created');
      }

      if (eventType === EventType.ADMIN_USER_SUSPENDED) {
        await this.redisService.increment('analytics:admin:users_suspended');
      }

    } catch (error) {
      this.logger.error('Failed to update admin analytics:', error);
    }
  }

  /**
   * Get user activity timeline
   */
  async getUserActivity(userId: string, limit: number = 50): Promise<UserActivity[]> {
    try {
      return await this.userActivityModel
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get user activity for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get system-wide event logs
   */
  async getEventLogs(
    filters: {
      eventType?: EventType;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
    limit: number = 100,
  ): Promise<EventLog[]> {
    try {
      const query: any = {};

      if (filters.eventType) {
        query.eventType = filters.eventType;
      }

      if (filters.userId) {
        query.userId = filters.userId;
      }

      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) {
          query.timestamp.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.timestamp.$lte = filters.endDate;
        }
      }

      return await this.eventLogModel
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error('Failed to get event logs:', error);
      throw error;
    }
  }

  /**
   * Get real-time analytics from Redis
   */
  async getRealTimeAnalytics(): Promise<any> {
    try {
      const [
        totalUsers,
        activeUsers,
        totalTasks,
        completedTasks,
        failedLogins,
      ] = await Promise.all([
        this.redisService.getCounter('analytics:users:total'),
        this.redisService.scard('analytics:active_users'),
        this.redisService.getCounter('analytics:tasks:total'),
        this.redisService.getCounter('analytics:tasks:completed'),
        this.redisService.getCounter('analytics:security:failed_logins'),
      ]);

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        },
        security: {
          failedLogins,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get real-time analytics:', error);
      throw error;
    }
  }
} 