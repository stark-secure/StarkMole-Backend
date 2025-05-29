import { Controller, Post, Body, UseGuards, Request, ValidationPipe } from "@nestjs/common"
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
}
