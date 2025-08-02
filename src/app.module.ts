import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './database.service';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { AppConfigModule } from './config/config.module';
import { AppConfigService } from './config/app.config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (appConfigService: any) => ({
        uri: appConfigService.getDatabaseConfig().uri,
      }),
      inject: [AppConfigService],
    }),
    AppConfigModule,
    AuthModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseService],
  exports: [AppConfigModule],
})
export class AppModule {}
