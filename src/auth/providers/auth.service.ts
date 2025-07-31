import { Injectable, ConflictException, UnauthorizedException, Inject, forwardRef, Logger, BadRequestException, TooManyRequestsException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { plainToClass } from "class-transformer"
import { ReadUserDto } from "src/users/dto/read-user.dto"
import { UserService } from "src/users/providers/users.service"
import { RegisterDto } from "../dto/register.dto"
import { HashingService } from "./hashing.service"
import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/mail/mail.service';
import { addHours } from 'date-fns';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { AnalyticsEvent } from 'src/analytics/analytics-event.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDurationMinutes = 15;
  private readonly jwtExpiresIn = '24h';
  
  // In-memory store for failed attempts (in production, use Redis)
  private failedAttempts = new Map<string, { count: number; lockedUntil?: Date }>();

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly hashingService: HashingService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => AnalyticsService))
    private readonly analyticsService: AnalyticsService,
  ) {}

  async validateUser(email: string, password: string, clientIp?: string): Promise<any> {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if account is locked
    await this.checkAccountLockout(normalizedEmail);
    
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user) {
      await this.recordFailedAttempt(normalizedEmail);
      this.logger.warn(`Login attempt for non-existent user: ${normalizedEmail} from IP: ${clientIp}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    
    if (!user.isActive) {
      this.logger.warn(`Login attempt for inactive user: ${normalizedEmail}`);
      throw new UnauthorizedException('Account is deactivated');
    }
    
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email to log in');
    }
    
    const isMatch = await this.hashingService.comparePassword(password, user.password);
    if (!isMatch) {
      await this.recordFailedAttempt(normalizedEmail);
      this.logger.warn(`Failed login attempt for user: ${normalizedEmail} from IP: ${clientIp}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Clear failed attempts on successful login
    this.clearFailedAttempts(normalizedEmail);
    this.logger.log(`Successful login for user: ${normalizedEmail}`);
    
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

    // Track login event
    if (this.analyticsService) {
      await this.analyticsService.track(AnalyticsEvent.UserLoggedIn, { userId: user.id });
    }

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
      // Track registration event
      if (this.analyticsService) {
        await this.analyticsService.track(AnalyticsEvent.UserRegistered, { userId: fullUser.id });
      }
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

  private async checkAccountLockout(email: string): Promise<void> {
    const attempts = this.failedAttempts.get(email);
    if (attempts?.lockedUntil && attempts.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((attempts.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      this.logger.warn(`Account locked for user: ${email}. Remaining: ${remainingMinutes} minutes`);
      throw new TooManyRequestsException(
        `Account temporarily locked due to too many failed login attempts. Try again in ${remainingMinutes} minutes.`
      );
    }
  }

  private async recordFailedAttempt(email: string): Promise<void> {
    const attempts = this.failedAttempts.get(email) || { count: 0 };
    attempts.count += 1;

    if (attempts.count >= this.maxLoginAttempts) {
      attempts.lockedUntil = new Date(Date.now() + this.lockoutDurationMinutes * 60 * 1000);
      this.logger.warn(`Account locked for user: ${email} after ${attempts.count} failed attempts`);
    }

    this.failedAttempts.set(email, attempts);
  }

  private clearFailedAttempts(email: string): void {
    this.failedAttempts.delete(email);
  }

  /**
   * Get remaining lockout time for an email
   */
  getRemainingLockoutTime(email: string): number {
    const attempts = this.failedAttempts.get(email);
    if (attempts?.lockedUntil && attempts.lockedUntil > new Date()) {
      return Math.ceil((attempts.lockedUntil.getTime() - Date.now()) / (1000 * 60));
    }
    return 0;
  }

  /**
   * Manually unlock an account (admin function)
   */
  unlockAccount(email: string): void {
    this.failedAttempts.delete(email);
    this.logger.log(`Account manually unlocked for user: ${email}`);
  }
}
