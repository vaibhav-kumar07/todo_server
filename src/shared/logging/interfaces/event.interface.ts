import { EventType } from '../../../config/environment.enum';

export interface EventMetadata {
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number; // in milliseconds
  [key: string]: any;
}

export interface EventData {
  [key: string]: any;
}

export interface EventLog {
  _id?: string;
  userId?: string;
  eventType: EventType;
  eventData: EventData;
  metadata: EventMetadata;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserActivity {
  _id?: string;
  userId: string;
  eventType: EventType;
  eventData: EventData;
  metadata: EventMetadata;
  timestamp: Date;
  createdAt?: Date;
}

export interface AnalyticsCache {
  key: string;
  value: any;
  timestamp: Date;
  expiresAt: Date;
}

export interface UserAnalytics {
  userId: string;
  tasksCompleted: number;
  tasksCreated: number;
  tasksAssigned: number;
  completionRate: number;
  averageTaskDuration: number; // in hours
  lastActivity: Date;
  updatedAt: Date;
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  newRegistrations: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  completionRate: number;
  failedLogins: number;
  suspiciousActivities: number;
  updatedAt: Date;
} 