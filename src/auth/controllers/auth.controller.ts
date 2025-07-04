import { Controller, Post, Body, UseGuards, Request, ValidationPipe, Query, Get, Res, HttpStatus } from "@nestjs/common"
import { AuthService } from "../providers/auth.service";
import { LocalAuthGuard } from "src/common/guards/local-auth.guard";
import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Body(ValidationPipe) loginDto: LoginDto, @Request() req) {
    return this.authService.login(req.user)
  }

  @Post('register')
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
  ) {
    return this.authService.register(registerDto);
  }

  @Post('resend-verification')
  async resendVerification(@Body('email') email: string, @Res() res) {
    try {
      const user = await this.authService.resendVerificationEmail(email);
      return res.status(HttpStatus.OK).json({ message: 'Verification email resent' });
    } catch (error) {
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res) {
    try {
      await this.authService.verifyEmail(token);
      return res.status(HttpStatus.OK).json({ message: 'Email verified successfully' });
    } catch (error) {
      return res.status(error.status || HttpStatus.BAD_REQUEST).json({ message: error.message });
    }
  }
}
