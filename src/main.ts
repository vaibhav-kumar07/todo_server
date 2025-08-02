import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app.config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const appConfigService = app.get(AppConfigService);
  const logger = new Logger('Bootstrap');

  // Security middleware
  app.use(helmet());
  app.use(compression());

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
  
  await app.listen(port);
  
  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📊 Environment: ${environment}`);
  logger.log(`🗄️  MongoDB: ${mongoUri ? 'connected' : 'not configured'}`);
}
bootstrap();
