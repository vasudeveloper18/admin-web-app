import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Role } from './role.schema';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret: any) => {
      delete ret.passwordHash;
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret: any) => {
      delete ret.passwordHash;
      delete ret.__v;
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  /**
   * Reference to the master Roles collection.
   * Stores the ObjectId of the role assigned to this user.
   */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Role', required: true })
  roleId!: MongooseSchema.Types.ObjectId;

  /**
   * Denormalised role name kept in sync for fast permission checks
   * without needing to populate on every auth guard.
   */
  @Prop({ required: true, enum: ['ADMIN', 'TECHNICIAN'], default: 'TECHNICIAN' })
  role!: string;

  @Prop({ type: String, default: null })
  hashedRefreshToken?: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
