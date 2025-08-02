import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../../config/app.config.service';
import { LogLevel } from '../../config/environment.enum';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis | null = null;

  constructor(   
    private readonly appConfigService: AppConfigService,
  ) {}

  async onModuleInit() {
    try {
      const redisConfig = this.appConfigService.getRedisConfig();
      
      // Check if Redis is properly configured with non-default values
      if (!redisConfig.host || redisConfig.host === 'localhost' && redisConfig.port === 6379) {
        this.logger.log(LogLevel.WARN, '⚠️ Redis not configured - using default values, skipping Redis initialization');
        this.logger.log(LogLevel.WARN, '💡 To enable Redis, set REDIS_HOST and REDIS_PORT environment variables');
        return;
      }

      this.logger.log(LogLevel.INFO, `🔗 Attempting to connect to Redis at ${redisConfig.host}:${redisConfig.port}`);
      
      this.redis = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        db: redisConfig.database,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 5000, // 5 second timeout
        commandTimeout: 3000, // 3 second timeout
      });

      this.redis.on('connect', () => {
        this.logger.log(LogLevel.INFO, '✅ Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        this.logger.error(LogLevel.ERROR, '❌ Redis connection error:', error);
      });

      this.redis.on('close', () => {
        this.logger.warn(LogLevel.WARN, '⚠️ Redis connection closed');
      });

      // Try to connect with timeout
      await Promise.race([
        this.redis.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        )
      ]);

      // Test the connection with a ping
      const pingResult = await this.redis.ping();
      if (pingResult !== 'PONG') {
        throw new Error('Redis ping failed');
      }

      this.logger.log(LogLevel.INFO, '✅ Redis connection verified with ping');
    } catch (error) {
      this.logger.error(LogLevel.ERROR, '❌ Failed to connect to Redis:', error);
      this.logger.warn(LogLevel.WARN, '⚠️ Continuing without Redis - some features may be limited');
      this.redis = null; // Ensure redis is null when connection fails
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log(LogLevel.INFO, '🔌 Redis connection closed');
    }
  }

  // Basic Redis operations
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.redis) {
      this.logger.warn(LogLevel.WARN, '⚠️ Redis not available - skipping set operation');
      return;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error(LogLevel.ERROR, `❌ Failed to set key ${key}:`, error);
      throw error;
    }
  }

  async get(key: string): Promise<any> {
    if (!this.redis) {
      this.logger.warn(LogLevel.WARN, '⚠️ Redis not available - returning null');
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(LogLevel.ERROR, `❌ Failed to get key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) {
      this.logger.warn('⚠️ Redis not available - skipping delete operation');
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`❌ Failed to delete key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redis) {
      this.logger.warn('⚠️ Redis not available - returning false');
      return false;
    }

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
    if (!this.redis) {
      this.logger.warn(LogLevel.WARN, '⚠️ Redis not available - skipping increment operation');
      return 0;
    }

    try {
      return await this.redis.incrby(key, amount);
    } catch (error) {
      this.logger.error(LogLevel.ERROR, `❌ Failed to increment key ${key}:`, error);
      throw error;
    }
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    if (!this.redis) {
      this.logger.warn('⚠️ Redis not available - skipping decrement operation');
      return 0;
    }

    try {
      return await this.redis.decrby(key, amount);
    } catch (error) {
      this.logger.error(`❌ Failed to decrement key ${key}:`, error);
      throw error;
    }
  }

  async getCounter(key: string): Promise<number> {
    if (!this.redis) {
      this.logger.warn('⚠️ Redis not available - returning 0');
      return 0;
    }

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
    if (!this.redis) {
      this.logger.warn('⚠️ Redis not available - skipping hset operation');
      return;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.hset(key, field, serializedValue);
    } catch (error) {
      this.logger.error(`❌ Failed to hset ${key}:${field}:`, error);
      throw error;
    }
  }

  async hget(key: string, field: string): Promise<any> {
    if (!this.redis) {
      this.logger.warn('⚠️ Redis not available - returning null');
      return null;
    }

    try {
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`❌ Failed to hget ${key}:${field}:`, error);
      throw error;
    }
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    if (!this.redis) {
      this.logger.warn('⚠️ Redis not available - returning empty object');
      return {};
    }

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
    if (!this.redis) {
      this.logger.warn('⚠️ Redis not available - skipping lpush operation');
      return 0;
    }

    try {
      const serializedValue = JSON.stringify(value);
      return await this.redis.lpush(key, serializedValue);
    } catch (error) {
      this.logger.error(`❌ Failed to lpush ${key}:`, error);
      throw error;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<any[]> {
    if (!this.redis) {
      this.logger.warn('⚠️ Redis not available - returning empty array');
      return [];
    }

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
    if (!this.redis) {
      this.logger.warn('⚠️ Redis not available - skipping sadd operation');
      return 0;
    }

    try {
      return await this.redis.sadd(key, member);
    } catch (error) {
      this.logger.error(`❌ Failed to sadd ${key}:`, error);
      throw error;
    }
  }

  async scard(key: string): Promise<number> {
    if (!this.redis) {
      this.logger.warn('⚠️ Redis not available - returning 0');
      return 0;
    }

    try {
      return await this.redis.scard(key);
    } catch (error) {
      this.logger.error(`❌ Failed to scard ${key}:`, error);
      throw error;
    }
  }

  // Health check
  async ping(): Promise<string> {
    if (!this.redis) {
      this.logger.warn(LogLevel.WARN, '⚠️ Redis not available - returning error');
      throw new Error('Redis not available');
    }

    try {
      return await this.redis.ping();
    } catch (error) {
      this.logger.error(LogLevel.ERROR, '❌ Redis ping failed:', error);
      throw error;
    }
  }

  // Get Redis client for advanced operations
  getClient(): Redis | null {
    return this.redis;
  }
} 