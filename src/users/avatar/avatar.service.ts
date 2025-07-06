import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class AvatarService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async uploadAndSaveAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    
    const filename = `${userId}-${Date.now()}-avatar.webp`; 
    const uploadDir = path.join(process.cwd(), 'public', 'avatars'); 
    const filePath = path.join(uploadDir, filename);

    
    await fs.mkdir(uploadDir, { recursive: true });

    try {
      await sharp(file.buffer)
        .resize(200, 200, {
          fit: sharp.fit.cover,
          position: sharp.strategy.attention,
        })
        .webp({ quality: 80 }) 
        .toFile(filePath);
    } catch (error) {
      console.error('Error processing image:', error);
      throw new HttpException(
        'Failed to process image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    
    const avatarUrl = `/avatars/${filename}`; 
    user.avatarUrl = avatarUrl;
    await user.save();

    return { message: 'Avatar uploaded successfully', avatarUrl };
  }

  
  getDefaultAvatarUrl(): string {
    return '/avatars/default-avatar.png'; 
  }
}