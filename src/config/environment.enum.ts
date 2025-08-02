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