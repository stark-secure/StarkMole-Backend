import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { plainToClass } from "class-transformer"
import { ReadUserDto } from "src/users/dto/read-user.dto"
import { UserService } from "src/users/providers/users.service"
import { RegisterDto } from "../dto/register.dto"
import { HashingService } from "./hashing.service"

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly hashingService: HashingService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException();
  
    const isMatch = await this.hashingService.comparePassword(password, user.password);
    if (!isMatch) throw new UnauthorizedException();
  
    return user;
  }
  

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    }

    // Update last login
    await this.userService.updateLastLogin(user.id)

    return {
      access_token: this.jwtService.sign(payload),
      user: plainToClass(ReadUserDto, user, {
        excludeExtraneousValues: true,
      }),
    }
  }

  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: ReadUserDto }> {
    try {
      const hashedPassword = await this.hashingService.hashPassword(registerDto.password);

      const user = await this.userService.create({
        ...registerDto,
        password: hashedPassword,
        role: undefined,
      });
      

      // Get the full user object for login
      const fullUser = await this.userService.findByEmail(user.email)

      return this.login(fullUser)
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error
      }
      throw new Error("Registration failed")
    }
  }
}
