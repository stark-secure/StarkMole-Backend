import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { ReadUserDto } from '../dto/read-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { plainToInstance } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<ReadUserDto> {
    // Query only id/email/username to avoid loading the full user entity (large fields/relations)
    const existingUser = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.username'])
      .where('user.email = :email', { email: createUserDto.email })
      .orWhere('user.username = :username', { username: createUserDto.username })
      .getOne();

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.username === createUserDto.username) {
        throw new ConflictException('Username already exists');
      }
    }

    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);

    return plainToClass(ReadUserDto, savedUser, {
      excludeExtraneousValues: true,
    });
  }

  // Support pagination and select only summary fields to avoid large payloads
  async findAll(limit = 100, offset = 0): Promise<ReadUserDto[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.username', 'user.displayName', 'user.createdAt'])
      .orderBy('user.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    return users.map((user) =>
      plainToClass(ReadUserDto, user, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findOne(id: string): Promise<ReadUserDto> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return plainToClass(ReadUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    // Only select fields required for authentication to avoid loading large JSON fields
    return this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.password', 'user.isActive', 'user.isEmailVerified'])
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByUsername(username: string): Promise<User | null> {
    // Select only authentication/contact fields to keep this lookup light-weight
    return this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.password',
        'user.isActive',
        'user.isEmailVerified',
      ])
      .where('user.username = :username', { username })
      .getOne();
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    // Only need id and email for token verification paths
    return this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.emailVerificationToken'])
      .where('user.emailVerificationToken = :token', { token })
      .getOne();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<ReadUserDto> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check for email/username conflicts if they're being updated
    // Use safe 'in' checks because UpdateUserDto properties are optional/mapped types
    const hasEmail = 'email' in updateUserDto && (updateUserDto as any).email;
    const hasUsername = 'username' in updateUserDto && (updateUserDto as any).username;

    if (hasEmail || hasUsername) {
      const whereConditions: any[] = [];
      if (hasEmail) {
        whereConditions.push({ email: (updateUserDto as any).email });
      }
      if (hasUsername) {
        whereConditions.push({ username: (updateUserDto as any).username });
      }

      const existingUser = await this.userRepository.findOne({
        where: whereConditions,
      });

      if (existingUser && existingUser.id !== id) {
        if (hasEmail && existingUser.email === (updateUserDto as any).email) {
          throw new ConflictException('Email already exists');
        }
        if (hasUsername && existingUser.username === (updateUserDto as any).username) {
          throw new ConflictException('Username already exists');
        }
      }
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    return plainToClass(ReadUserDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isCurrentPasswordValid = await user.validatePassword(
      changePasswordDto.currentPassword,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = changePasswordDto.newPassword;
    await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLogin: new Date(),
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);

    if (user && (await user.validatePassword(password))) {
      return user;
    }

    return null;
  }

  async updateUserStats(
    userId: string,
    stats: {
      gamesPlayed?: number;
      totalScore?: number;
      highestScore?: number;
      currentStreak?: number;
      longestStreak?: number;
    },
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update stats incrementally or set new values
    if (stats.gamesPlayed !== undefined) {
      user.gamesPlayed += stats.gamesPlayed;
    }
    if (stats.totalScore !== undefined) {
      user.totalScore += stats.totalScore;
    }
    if (
      stats.highestScore !== undefined &&
      stats.highestScore > user.highestScore
    ) {
      user.highestScore = stats.highestScore;
    }
    if (stats.currentStreak !== undefined) {
      user.currentStreak = stats.currentStreak;
    }
    if (
      stats.longestStreak !== undefined &&
      stats.longestStreak > user.longestStreak
    ) {
      user.longestStreak = stats.longestStreak;
    }

    await this.userRepository.save(user);
  }
}
function plainToClass<T, V>(
  cls: new (...args: any[]) => T,
  plain: V,
  options: { excludeExtraneousValues: boolean },
): T {
  return plainToInstance(cls, plain, options);
}
