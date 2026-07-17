import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  async updateProfile(
    userId: string,
    data: { firstName: string; lastName: string; email: string },
  ): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const email = data.email.trim().toLowerCase();
    if (email !== user.email) {
      const existing = await this.userModel.findOne({ email }).exec();
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Email is already in use');
      }
    }

    user.firstName = data.firstName.trim();
    user.lastName = data.lastName.trim();
    user.email = email;

    return user.save();
  }

  async create(userDto: Partial<User>): Promise<UserDocument> {
    const newUser = new this.userModel(userDto);
    return newUser.save();
  }
}
