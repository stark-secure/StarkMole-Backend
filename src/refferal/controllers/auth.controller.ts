import { Controller, Post } from "@nestjs/common"
import type { AuthService } from "../services/auth.service"
import type { RegisterDto } from "../dto/auth.dto"
import type { User } from "../entities/user.entity"

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(registerDto: RegisterDto): Promise<Omit<User, "password">> {
    const user = await this.authService.register(registerDto)
    const { password, ...result } = user
    return result
  }
}
