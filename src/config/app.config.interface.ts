import { Environment, DatabaseType, LogLevel, CorsOrigin } from './environment.enum';

export interface DatabaseConfig {
  type: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  uri: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface CorsConfig {
  origins: string[];
  credentials: boolean;
}

export interface WebSocketConfig {
  cors: CorsConfig;
  port: number;
}

export interface AppConfig {
  environment: Environment;
  port: number;
  host: string;
  logLevel: LogLevel;
  database: DatabaseConfig;
  jwt: JwtConfig;
  email: EmailConfig;
  cors: CorsConfig;
  websocket: WebSocketConfig;
  apiPrefix: string;
  nodeEnv: string;
} 