export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum DatabaseType {
  MONGODB = 'mongodb',
  POSTGRES = 'postgres',
  MYSQL = 'mysql',
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export enum CorsOrigin {
  LOCALHOST_3000 = 'http://localhost:3000',
  LOCALHOST_3001 = 'http://localhost:3001',
  LOCALHOST_5500 = 'http://127.0.0.1:5500',
  LOCALHOST_5501 = 'http://127.0.0.1:5501',
  PRODUCTION_FRONTEND = 'https://your-frontend-domain.com',
}

export enum EventType {
  // User Events
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_PROFILE_UPDATED = 'USER_PROFILE_UPDATED',
  USER_PASSWORD_CHANGED = 'USER_PASSWORD_CHANGED',
  
  // Task Events
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  
  // Team Events
  TEAM_JOINED = 'TEAM_JOINED',
  TEAM_LEFT = 'TEAM_LEFT',
  TEAM_ROLE_CHANGED = 'TEAM_ROLE_CHANGED',
  
  // Admin Events
  ADMIN_USER_CREATED = 'ADMIN_USER_CREATED',
  ADMIN_USER_SUSPENDED = 'ADMIN_USER_SUSPENDED',
  ADMIN_USER_ROLE_CHANGED = 'ADMIN_USER_ROLE_CHANGED',
  
  // Security Events
  SECURITY_FAILED_LOGIN = 'SECURITY_FAILED_LOGIN',
  SECURITY_SUSPICIOUS_ACTIVITY = 'SECURITY_SUSPICIOUS_ACTIVITY',
} 