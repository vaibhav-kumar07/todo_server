import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  Environment, 
  DatabaseType, 
  LogLevel, 
  CorsOrigin 
} from './environment.enum';
import { 
  AppConfig, 
  DatabaseConfig, 
  JwtConfig, 
  EmailConfig, 
  CorsConfig, 
  WebSocketConfig 
} from './app.config.interface';

@Injectable()
export class AppConfigService {
  private config: AppConfig;

  constructor(private configService: ConfigService) {
    this.loadConfig();
  }

  private loadConfig(): void {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const environment = this.parseEnvironment(nodeEnv);

    this.config = {
      environment,
      nodeEnv,
      port: this.configService.get<number>('PORT', 3000),
      host: this.configService.get<string>('HOST', 'localhost'),
      logLevel: this.getLogLevel(this.configService.get<string>('LOG_LEVEL', 'info')),
      apiPrefix: this.configService.get<string>('API_PREFIX', 'api/v1'),
      database: this.loadDatabaseConfig(),
      jwt: this.loadJwtConfig(),
      email: this.loadEmailConfig(),
      cors: this.loadCorsConfig(environment),
      websocket: this.loadWebSocketConfig(environment),
    };
  }

  private parseEnvironment(nodeEnv: string): Environment {
    switch (nodeEnv.toLowerCase()) {
      case 'production':
        return Environment.PRODUCTION;
      case 'test':
        return Environment.TEST;
      default:
        return Environment.DEVELOPMENT;
    }
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'debug':
        return LogLevel.DEBUG;
      case 'verbose':
        return LogLevel.VERBOSE;
      default:
        return LogLevel.INFO;
    }
  }

  private loadDatabaseConfig(): DatabaseConfig {
    return {
      type: DatabaseType.MONGODB,
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 27017),
      username: this.configService.get<string>('DB_USERNAME', ''),
      password: this.configService.get<string>('DB_PASSWORD', ''),
      database: this.configService.get<string>('DB_NAME', 'nest-crud-api'),
      uri: this.configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/nest-crud-api'),
    };
  }

  private loadJwtConfig(): JwtConfig {
    return {
      secret: this.configService.get<string>('JWT_SECRET', 'your-secret-key'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1d'),
      refreshSecret: this.configService.get<string>('JWT_REFRESH_SECRET', 'your-refresh-secret-key'),
      refreshExpiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    };
  }

  private loadEmailConfig(): EmailConfig {
    return {
      host: this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('EMAIL_PORT', 587),
      secure: this.configService.get<boolean>('EMAIL_SECURE', false),
      auth: {
        user: this.configService.get<string>('EMAIL_USER', ''),
        pass: this.configService.get<string>('EMAIL_PASS', ''),
      },
      from: this.configService.get<string>('EMAIL_FROM', 'noreply@example.com'),
    };
  }

  private loadCorsConfig(environment: Environment): CorsConfig {
    const origins = environment === Environment.PRODUCTION
      ? [CorsOrigin.PRODUCTION_FRONTEND]
      : [
          CorsOrigin.LOCALHOST_3000,
          CorsOrigin.LOCALHOST_3001,
          CorsOrigin.LOCALHOST_5500,
          CorsOrigin.LOCALHOST_5501,
        ];

    return {
      origins,
      credentials: true,
    };
  }

  private loadWebSocketConfig(environment: Environment): WebSocketConfig {
    return {
      cors: this.loadCorsConfig(environment),
      port: this.configService.get<number>('WS_PORT', 3000),
    };
  }

  // Public getters for accessing configuration
  public getConfig(): AppConfig {
    return this.config;
  }

  public getEnvironment(): Environment {
    return this.config.environment;
  }

  public getPort(): number {
    return this.config.port;
  }

  public getHost(): string {
    return this.config.host;
  }

 

  public getDatabaseConfig(): DatabaseConfig {
    return this.config.database;
  }

  public getJwtConfig(): JwtConfig {
    return this.config.jwt;
  }

  public getEmailConfig(): EmailConfig {
    return this.config.email;
  }

  public getCorsConfig(): CorsConfig {
    return this.config.cors;
  }

  public getWebSocketConfig(): WebSocketConfig {
    return this.config.websocket;
  }

  public getApiPrefix(): string {
    return this.config.apiPrefix;
  }

  public isDevelopment(): boolean {
    return this.config.environment === Environment.DEVELOPMENT;
  }

  public isProduction(): boolean {
    return this.config.environment === Environment.PRODUCTION;
  }

  public isTest(): boolean {
    return this.config.environment === Environment.TEST;
  }
} 