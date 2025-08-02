import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EventType } from '../../../config/environment.enum';

export type EventLogDocument = EventLog & Document;

@Schema({ timestamps: true })
export class EventLog {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

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

export const EventLogSchema = SchemaFactory.createForClass(EventLog);

// Indexes for better query performance
EventLogSchema.index({ userId: 1, timestamp: -1 });
EventLogSchema.index({ eventType: 1, timestamp: -1 });
EventLogSchema.index({ timestamp: -1 });
EventLogSchema.index({ 'metadata.ip': 1 }); 