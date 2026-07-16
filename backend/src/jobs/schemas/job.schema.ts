import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type JobDocument = Job & Document;

export enum JobStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret: any) => {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret: any) => {
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  },
})
export class Job {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, trim: true })
  customerName!: string;

  @Prop({ required: true, trim: true })
  customerPhone!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  customerEmail!: string;

  @Prop({ required: true, trim: true })
  address!: string;

  @Prop({ required: true })
  latitude!: number;

  @Prop({ required: true })
  longitude!: number;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  })
  location!: {
    type: string;
    coordinates: number[];
  };

  @Prop({ required: true, enum: JobStatus, default: JobStatus.PENDING, index: true })
  status!: JobStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true, default: null })
  assignedTechnician!: MongooseSchema.Types.ObjectId | null;

  @Prop({ trim: true })
  completionNotes?: string;

  @Prop({ type: [String], default: [] })
  completionPhotos!: string[];

  @Prop({ required: true, index: true })
  scheduledDate!: Date;

  @Prop({ type: Date, default: null })
  completedDate!: Date | null;

  @Prop({ trim: true })
  cancelReason?: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);

// Create compound or special indexes
JobSchema.index({ location: '2dsphere' });
