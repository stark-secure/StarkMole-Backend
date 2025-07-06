
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AvatarService } from './avatar.service';
import { User, UserDocument } from './schemas/user.schema';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';


jest.mock('sharp', () => {
  const mSharp = {
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue({ info: { size: 100 } }),
  };
  return jest.fn(() => mSharp);
});


jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined), 
}));

describe('AvatarService', () => {
  let service: AvatarService;
  let userModel: Model<UserDocument>;

  const mockUserId = '60c72b2f9b1d8d001c8e4d1a';
  const mockUser = {
    _id: mockUserId,
    username: 'testuser',
    email: 'test@example.com',
    avatarUrl: 'old-avatar.png',
    save: jest.fn().mockResolvedValue(true), 
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'upload.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 100 * 1024,
    buffer: Buffer.from('dummy image data'),
    stream: null, 
    destination: null,
    filename: null,
    path: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findById: jest.fn().mockResolvedValue(mockUser),
            
          },
        },
      ],
    }).compile();

    service = module.get<AvatarService>(AvatarService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));

    
    jest.clearAllMocks();
    (sharp as jest.Mock).mockClear(); 
    (fs.mkdir as jest.Mock).mockClear();
    mockUser.save.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadAndSaveAvatar', () => {
    it('should successfully process and save the avatar', async () => {
      const result = await service.uploadAndSaveAvatar(mockUserId, mockFile);

      
      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);

      
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining(path.join(process.cwd(), 'public', 'avatars')),
        { recursive: true }
      );

      
      expect(sharp).toHaveBeenCalledWith(mockFile.buffer);
      
      expect((sharp as jest.Mock).mock.results[0].value.resize).toHaveBeenCalledWith(200, 200, expect.any(Object));
      expect((sharp as jest.Mock).mock.results[0].value.webp).toHaveBeenCalledWith(expect.any(Object));
      expect((sharp as jest.Mock).mock.results[0].value.toFile).toHaveBeenCalledWith(
        expect.stringContaining(path.join(process.cwd(), 'public', 'avatars', `${mockUserId}-`)) 
      );

      
      expect(mockUser.avatarUrl).toMatch(new RegExp(`^/avatars/${mockUserId}-.*\\.webp$`));
      expect(mockUser.save).toHaveBeenCalled();

      
      expect(result).toEqual({
        message: 'Avatar uploaded successfully',
        avatarUrl: expect.stringMatching(new RegExp(`^/avatars/${mockUserId}-.*\\.webp$`)),
      });
    });

    it('should throw HttpException if user not found', async () => {
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(null); 

      await expect(service.uploadAndSaveAvatar(mockUserId, mockFile)).rejects.toThrow(
        new HttpException('User not found', HttpStatus.NOT_FOUND)
      );

      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(fs.mkdir).not.toHaveBeenCalled(); 
      expect(sharp).not.toHaveBeenCalled(); 
      expect(mockUser.save).not.toHaveBeenCalled(); 
    });

    it('should throw HttpException if image processing fails', async () => {
      
      jest.spyOn((sharp as jest.Mock)().toFile, 'mockResolvedValue').mockRejectedValueOnce(
        new Error('Sharp processing error')
      );

      await expect(service.uploadAndSaveAvatar(mockUserId, mockFile)).rejects.toThrow(
        new HttpException('Failed to process image', HttpStatus.INTERNAL_SERVER_ERROR)
      );

      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(fs.mkdir).toHaveBeenCalled(); 
      expect(sharp).toHaveBeenCalledWith(mockFile.buffer);
      expect(mockUser.save).not.toHaveBeenCalled(); 
    });

    it('should return default avatar URL', () => {
      expect(service.getDefaultAvatarUrl()).toBe('/avatars/default-avatar.png');
    });
  });
});