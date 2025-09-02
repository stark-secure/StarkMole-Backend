import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
  Query,
  Get,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from '../providers/auth.service';
import { LocalAuthGuard } from 'src/common/guards/local-auth.guard';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import {
  LoginResponseDto,
  RegisterResponseDto,
  MessageResponseDto,
} from '../dto/auth-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @Throttle(5, 60) // 5 requests per minute per IP
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto, @Request() req) {
    return this.authService.login(req.user);
  }

  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or user already exists',
  })
  @Throttle(3, 60) // 3 requests per minute per IP
  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Resend email verification' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email resent successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email or user not found',
  })
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string, @Res() res) {
    try {
      const user = await this.authService.resendVerificationEmail(email);
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Verification email resent' });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.BAD_REQUEST)
        .json({ message: error.message });
    }
  }

  @ApiOperation({ summary: 'Verify user email' })
  @ApiQuery({
    name: 'token',
    description: 'Email verification token',
    example: 'abc123-def456-ghi789',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
  })
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res) {
    try {
      await this.authService.verifyEmail(token);
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Email verified successfully' });
    } catch (error) {
      return res
        .status(error.status || HttpStatus.BAD_REQUEST)
        .json({ message: error.message });
    }
  }
}
