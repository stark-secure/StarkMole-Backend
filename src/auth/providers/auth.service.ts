import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { plainToClass } from "class-transformer"
import { ReadUserDto } from "src/users/dto/read-user.dto"
import { UserService } from "src/users/providers/users.service"
import { RegisterDto } from "../dto/register.dto"
import { HashingService } from "./hashing.service"
import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/mail/mail.service';
import { addHours } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly hashingService: HashingService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException();
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email to log in');
    }
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
      const emailVerificationToken = uuidv4();
      const emailVerificationExpires = addHours(new Date(), 24);
      const user = await this.userService.create({
        ...registerDto,
        password: hashedPassword,
        isEmailVerified: false,
        emailVerificationToken,
        emailVerificationExpires,
        role: undefined,
      });
      const fullUser = await this.userService.findByEmail(user.email);
      const verificationUrl = `https://yourapp.com/verify-email?token=${emailVerificationToken}`;
      await this.mailService.sendVerificationEmail(
        fullUser.email,
        fullUser.username,
        verificationUrl
      );
      return {
        access_token: '', 
        user: fullUser,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('Registration failed');
    }
  }

  async verifyEmail(token: string): Promise<boolean> {
    const user = await this.userService.findByVerificationToken(token);
    if (!user) throw new UnauthorizedException('Invalid or expired verification token');
    if (user.isEmailVerified) throw new ConflictException('Email already verified');
    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new UnauthorizedException('Verification token expired');
    }
    await this.userService.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    });
    return true;
  }

  async resendVerificationEmail(email: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');
    if (user.isEmailVerified) throw new ConflictException('Email already verified');
    const emailVerificationToken = uuidv4();
    const emailVerificationExpires = addHours(new Date(), 24);
    await this.userService.update(user.id, {
      emailVerificationToken,
      emailVerificationExpires,
    });
    const verificationUrl = `https://yourapp.com/verify-email?token=${emailVerificationToken}`;
    await this.mailService.sendVerificationEmail(
      user.email,
      user.username,
      verificationUrl
    );
    return true;
  }
}
