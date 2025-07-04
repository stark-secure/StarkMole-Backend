import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common"
import { Repository } from "typeorm"
import { User } from "../entities/user.entity"
import { CreateUserDto } from "../dto/create-user.dto"
import { ReadUserDto } from "../dto/read-user.dto"
import { ChangePasswordDto } from "../dto/change-password.dto"
import { UpdateUserDto } from "../dto/update-user.dto"
import { plainToInstance } from "class-transformer"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class UserService {
   constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<ReadUserDto> {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: createUserDto.email }, { username: createUserDto.username }],
    })

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException("Email already exists")
      }
      if (existingUser.username === createUserDto.username) {
        throw new ConflictException("Username already exists")
      }
    }

    const user = this.userRepository.create(createUserDto)
    const savedUser = await this.userRepository.save(user)

    return plainToClass(ReadUserDto, savedUser, {
      excludeExtraneousValues: true,
    })
  }

  async findAll(): Promise<ReadUserDto[]> {
    const users = await this.userRepository.find({
      order: { createdAt: "DESC" },
    })

    return users.map((user) =>
      plainToClass(ReadUserDto, user, {
        excludeExtraneousValues: true,
      }),
    )
  }

  async findOne(id: string): Promise<ReadUserDto> {
    const user = await this.userRepository.findOne({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    return plainToClass(ReadUserDto, user, {
      excludeExtraneousValues: true,
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    })
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
    })
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { emailVerificationToken: token } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<ReadUserDto> {
    const user = await this.userRepository.findOne({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    // Check for email/username conflicts if they're being updated
    if (updateUserDto.email || updateUserDto.username) {
      const existingUser = await this.userRepository.findOne({
        where: [
          ...(updateUserDto.email ? [{ email: updateUserDto.email }] : []),
          ...(updateUserDto.username ? [{ username: updateUserDto.username }] : []),
        ],
      })

      if (existingUser && existingUser.id !== id) {
        if (existingUser.email === updateUserDto.email) {
          throw new ConflictException("Email already exists")
        }
        if (existingUser.username === updateUserDto.username) {
          throw new ConflictException("Username already exists")
        }
      }
    }

    Object.assign(user, updateUserDto)
    const updatedUser = await this.userRepository.save(user)

    return plainToClass(ReadUserDto, updatedUser, {
      excludeExtraneousValues: true,
    })
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    const isCurrentPasswordValid = await user.validatePassword(changePasswordDto.currentPassword)

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect")
    }

    user.password = changePasswordDto.newPassword
    await this.userRepository.save(user)
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    await this.userRepository.remove(user)
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLogin: new Date(),
    })
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email)

    if (user && (await user.validatePassword(password))) {
      return user
    }

    return null
  }
}
function plainToClass<T, V>(cls: new (...args: any[]) => T, plain: V, options: { excludeExtraneousValues: boolean }): T {
  return plainToInstance(cls, plain, options)
}

