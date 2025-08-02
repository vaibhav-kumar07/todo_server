# 🎯 Centralized Configuration System

## **📋 Overview**

This project now uses a **centralized configuration system** with enums and a single configuration service that loads all environment variables at startup. This eliminates scattered configuration checks and provides a clean, maintainable approach.

## **🏗️ Architecture**

### **📁 File Structure**
```
src/config/
├── environment.enum.ts          # Environment enums
├── app.config.interface.ts     # Configuration interfaces
├── app.config.service.ts       # Main configuration service
└── config.module.ts           # Configuration module
```

### **🔧 Key Components**

#### **1. Environment Enums (`environment.enum.ts`)**
```typescript
export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum CorsOrigin {
  LOCALHOST_3000 = 'http://localhost:3000',
  LOCALHOST_3001 = 'http://localhost:3001',
  LOCALHOST_5500 = 'http://127.0.0.1:5500',
  LOCALHOST_5501 = 'http://127.0.0.1:5501',
  PRODUCTION_FRONTEND = 'https://your-frontend-domain.com',
}
```

#### **2. Configuration Interfaces (`app.config.interface.ts`)**
```typescript
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
```

#### **3. Configuration Service (`app.config.service.ts`)**
- **Single Source of Truth**: All configuration loaded at startup
- **Environment-Based Logic**: Automatic CORS origins based on environment
- **Type Safety**: Full TypeScript support with interfaces
- **Validation**: Environment variable validation and defaults

## **🚀 Usage Examples**

### **In Main.ts**
```typescript
// Before (scattered configuration)
app.enableCors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : true,
  credentials: true,
});

// After (centralized configuration)
const corsConfig = appConfigService.getCorsConfig();
app.enableCors({
  origin: corsConfig.origins,
  credentials: corsConfig.credentials,
});
```

### **In WebSocket Gateway**
```typescript
// Before (hardcoded CORS)
@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-frontend-domain.com'] 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})

// After (dynamic configuration)
@WebSocketGateway()
export class TasksWebSocketGateway {
  constructor(private readonly appConfigService: AppConfigService) {}
  // CORS handled by configuration service
}
```

### **In Services**
```typescript
@Injectable()
export class SomeService {
  constructor(private readonly appConfigService: AppConfigService) {}

  someMethod() {
    const dbConfig = this.appConfigService.getDatabaseConfig();
    const jwtConfig = this.appConfigService.getJwtConfig();
    
    if (this.appConfigService.isDevelopment()) {
      // Development-specific logic
    }
  }
}
```

## **🔧 Environment Variables**

### **Required Variables**
```env
# Application
NODE_ENV=development
PORT=3000
HOST=localhost
API_PREFIX=api/v1
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb://localhost:27017/nest-crud-api
DB_HOST=localhost
DB_PORT=27017
DB_NAME=nest-crud-api

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@example.com

# WebSocket
WS_PORT=3000
```

## **🎯 Benefits**

### **✅ Advantages**
1. **Single Source of Truth**: All configuration in one place
2. **Type Safety**: Full TypeScript support with interfaces
3. **Environment-Based Logic**: Automatic configuration based on environment
4. **Maintainable**: Easy to add new configuration options
5. **Testable**: Easy to mock and test configuration
6. **Consistent**: Same configuration pattern across the application

### **🔄 Before vs After**

#### **Before (Scattered Configuration)**
```typescript
// Multiple places with hardcoded values
if (process.env.NODE_ENV === 'production') {
  // Production logic
}

app.enableCors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : true,
});

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
  },
})
```

#### **After (Centralized Configuration)**
```typescript
// Single configuration service
const corsConfig = appConfigService.getCorsConfig();
app.enableCors(corsConfig);

if (appConfigService.isProduction()) {
  // Production logic
}

@WebSocketGateway()
// CORS handled by configuration service
```

## **🔧 Integration**

### **1. Import Configuration Module**
```typescript
import { AppConfigModule } from './config/config.module';

@Module({
  imports: [AppConfigModule],
  // ...
})
export class SomeModule {}
```

### **2. Inject Configuration Service**
```typescript
constructor(private readonly appConfigService: AppConfigService) {}
```

### **3. Use Configuration**
```typescript
const config = this.appConfigService.getConfig();
const dbConfig = this.appConfigService.getDatabaseConfig();
const isDev = this.appConfigService.isDevelopment();
```

## **🎯 Next Steps**

1. **Update all services** to use the centralized configuration
2. **Add validation** for required environment variables
3. **Create configuration tests** to ensure proper loading
4. **Add configuration documentation** for each environment
5. **Implement configuration hot-reload** for development

---

**🎉 The configuration system is now centralized, type-safe, and maintainable!** 