import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EventType } from '../../../config/environment.enum';

export type UserActivityDocument = UserActivity & Document;

@Schema({ timestamps: true })
export class UserActivity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: EventType })
  eventType: EventType;

  @Prop({ type: Object, required: true })
  eventData: Record<string, any>;

  @Prop({ type: Object, required: true })
  metadata: {
    ip?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
    duration?: number;
    [key: string]: any;
  };

  @Prop({ required: true, default: Date.now })
  timestamp: Date;
}

export const UserActivitySchema = SchemaFactory.createForClass(UserActivity);

// Indexes for better query performance
UserActivitySchema.index({ userId: 1, timestamp: -1 });
UserActivitySchema.index({ userId: 1, eventType: 1, timestamp: -1 });
UserActivitySchema.index({ timestamp: -1 }); 