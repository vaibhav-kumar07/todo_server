import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppConfigService } from './config/app.config.service';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    private appConfigService: AppConfigService,
    @InjectConnection() private connection: Connection,
  ) {}

  async onModuleInit() {
    const dbConfig = this.appConfigService.getDatabaseConfig();
    const uri = dbConfig.uri;
    
    if (uri) {
      this.logger.log('✅ MongoDB URI: connected successfully');
      this.logger.log(`📊 Database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    } else {
      this.logger.error('❌ MongoDB URI: not configured');
    }
  }
} 