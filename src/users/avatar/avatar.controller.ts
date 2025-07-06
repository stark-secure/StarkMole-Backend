import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  HttpException,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AvatarService } from './avatar.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; 
import { UseGuards } from '@nestjs/common';

@UseGuards(JwtAuthGuard) 
@Controller('avatars')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }), // 2MB
          new FileTypeValidator({ fileType: 'image/(jpeg|png|gif)' }),
        ],
        exceptionFactory: (error) =>
          new HttpException(
            `File validation failed: ${error}`,
            HttpStatus.BAD_REQUEST,
          ),
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    // Assuming your JWT payload includes the user's ID
    const userId = req.user['id'];
    if (!userId) {
      throw new HttpException(
        'User ID not found in token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.avatarService.uploadAndSaveAvatar(userId, file);
  }
}