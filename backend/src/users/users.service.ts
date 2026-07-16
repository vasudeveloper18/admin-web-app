import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findTechnicians(): Promise<UserDocument[]> {
    return this.userModel.find({ role: 'TECHNICIAN' }).exec();
  }

  async create(userDto: Partial<User>): Promise<UserDocument> {
    const newUser = new this.userModel(userDto);
    return newUser.save();
  }
}
