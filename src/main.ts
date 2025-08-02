import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app.config.service';
import { LogLevel } from './config/environment.enum';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfigService = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');

  // Security middleware
  app.use(helmet());

  // CORS - using centralized configuration
  const corsConfig = appConfigService.getCorsConfig();
  app.enableCors({
    origin: corsConfig.origins,
    credentials: corsConfig.credentials,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix - using centralized configuration
  app.setGlobalPrefix(appConfigService.getApiPrefix());

  const port = appConfigService.getPort();
  const environment = appConfigService.getEnvironment();
  const mongoUri = appConfigService.getDatabaseConfig().uri;
  const redisConfig = appConfigService.getRedisConfig();
  
  await app.listen(port);
  
  logger.log(LogLevel.INFO, `🚀 Server running on http://localhost:${port}`);
  logger.log(LogLevel.INFO, `📊 Environment: ${environment}`);
  logger.log(LogLevel.INFO, `🗄️  MongoDB: ${mongoUri ? 'connected' : 'not configured'}`);
  logger.log(LogLevel.INFO, `🔴 Redis: ${redisConfig.host === 'localhost' && redisConfig.port === 6379 ? 'not configured (using defaults)' : `configured at ${redisConfig.host}:${redisConfig.port}`}`);
}
bootstrap();
