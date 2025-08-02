import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppConfigService } from '../../config/app.config.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly appConfigService: AppConfigService,
  ) {}

  async onModuleInit() {
    try {
      const redisConfig = this.appConfigService.getRedisConfig();
      
      this.redis = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        db: redisConfig.database,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.logger.log('✅ Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        this.logger.error('❌ Redis connection error:', error);
      });

      this.redis.on('close', () => {
        this.logger.warn('⚠️ Redis connection closed');
      });

      await this.redis.connect();
    } catch (error) {
      this.logger.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('🔌 Redis connection closed');
    }
  }

  // Basic Redis operations
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to set key ${key}:`, error);
      throw error;
    }
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`❌ Failed to get key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`❌ Failed to delete key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`❌ Failed to check existence of key ${key}:`, error);
      throw error;
    }
  }

  // Counter operations for analytics
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      this.logger.error(`❌ Failed to increment key ${key}:`, error);
      throw error;
    }
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.decrby(key, amount);
    } catch (error) {
      this.logger.error(`❌ Failed to decrement key ${key}:`, error);
      throw error;
    }
  }

  async getCounter(key: string): Promise<number> {
    try {
      const value = await this.redis.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      this.logger.error(`❌ Failed to get counter ${key}:`, error);
      throw error;
    }
  }

  // Hash operations for complex analytics
  async hset(key: string, field: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.hset(key, field, serializedValue);
    } catch (error) {
      this.logger.error(`❌ Failed to hset ${key}:${field}:`, error);
      throw error;
    }
  }

  async hget(key: string, field: string): Promise<any> {
    try {
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`❌ Failed to hget ${key}:${field}:`, error);
      throw error;
    }
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    try {
      const hash = await this.redis.hgetall(key);
      const result: Record<string, any> = {};
      
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to hgetall ${key}:`, error);
      throw error;
    }
  }

  // List operations for activity feeds
  async lpush(key: string, value: any): Promise<number> {
    try {
      const serializedValue = JSON.stringify(value);
      return await this.redis.lpush(key, serializedValue);
    } catch (error) {
      this.logger.error(`❌ Failed to lpush ${key}:`, error);
      throw error;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<any[]> {
    try {
      const list = await this.redis.lrange(key, start, stop);
      return list.map((item: string) => JSON.parse(item));
    } catch (error) {
      this.logger.error(`❌ Failed to lrange ${key}:`, error);
      throw error;
    }
  }

  // Set operations for unique counts
  async sadd(key: string, member: string): Promise<number> {
    try {
      return await this.redis.sadd(key, member);
    } catch (error) {
      this.logger.error(`❌ Failed to sadd ${key}:`, error);
      throw error;
    }
  }

  async scard(key: string): Promise<number> {
    try {
      return await this.redis.scard(key);
    } catch (error) {
      this.logger.error(`❌ Failed to scard ${key}:`, error);
      throw error;
    }
  }

  // Health check
  async ping(): Promise<string> {
    try {
      return await this.redis.ping();
    } catch (error) {
      this.logger.error('❌ Redis ping failed:', error);
      throw error;
    }
  }

  // Get Redis client for advanced operations
  getClient(): Redis {
    return this.redis;
  }
} 