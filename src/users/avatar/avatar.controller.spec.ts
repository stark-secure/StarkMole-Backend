import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module'; 
import { AvatarService } from './avatar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { AuthGuard } from '@nestjs/passport'; 

describe('AvatarController (e2e)', () => {
  let app: INestApplication;
  let avatarService: AvatarService;

  const mockUserId = '60c72b2f9b1d8d001c8e4d1a'; 
  const mockJwtToken = 'mock-jwt-token'; 

  const mockFile = {
    fieldname: 'file',
    originalname: 'test-avatar.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 500 * 1024, 
    buffer: Buffer.from('test image data'), 
  } as Express.Multer.File;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AvatarService) 
      .useValue({
        uploadAndSaveAvatar: jest.fn().mockResolvedValue({
          message: 'Avatar uploaded successfully',
          avatarUrl: `/avatars/${mockUserId}-avatar.webp`,
        }),
      })
      .overrideGuard(JwtAuthGuard) 
      .useValue({ canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: mockUserId }; 
          return true;
        }
      })
      
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: mockUserId }; 
          return true;
        }
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe()); 
    await app.init();

    avatarService = moduleFixture.get<AvatarService>(AvatarService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('/avatars/upload (POST) - should upload an avatar successfully', async () => {
    await request(app.getHttpServer())
      .post('/avatars/upload')
      .set('Authorization', `Bearer ${mockJwtToken}`)
      .attach('file', mockFile.buffer, {
        filename: mockFile.originalname,
        contentType: mockFile.mimetype,
      })
      .expect(201)
      .expect({
        message: 'Avatar uploaded successfully',
        avatarUrl: `/avatars/${mockUserId}-avatar.webp`,
      });

    expect(avatarService.uploadAndSaveAvatar).toHaveBeenCalledWith(
      mockUserId,
      expect.objectContaining({
        originalname: mockFile.originalname,
        mimetype: mockFile.mimetype,
      }),
    );
  });

  it('/avatars/upload (POST) - should return 400 for invalid file type', async () => {
    const invalidFile = {
      ...mockFile,
      mimetype: 'application/pdf',
      originalname: 'document.pdf',
    } as Express.Multer.File;

    await request(app.getHttpServer())
      .post('/avatars/upload')
      .set('Authorization', `Bearer ${mockJwtToken}`)
      .attach('file', invalidFile.buffer, {
        filename: invalidFile.originalname,
        contentType: invalidFile.mimetype,
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('File validation failed');
      });

    expect(avatarService.uploadAndSaveAvatar).not.toHaveBeenCalled();
  });

  it('/avatars/upload (POST) - should return 400 for file too large', async () => {
    const largeFile = {
      ...mockFile,
      size: 3 * 1024 * 1024, 
      buffer: Buffer.alloc(3 * 1024 * 1024, 'a'), 
    } as Express.Multer.File;

    await request(app.getHttpServer())
      .post('/avatars/upload')
      .set('Authorization', `Bearer ${