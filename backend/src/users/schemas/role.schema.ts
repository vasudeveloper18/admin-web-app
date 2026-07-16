import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

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
export class Role {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  name!: string; // e.g. "ADMIN", "TECHNICIAN"

  @Prop({ trim: true })
  description?: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
