import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common"
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { UserService } from "../providers/users.service";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "src/common/enums/role.enum";
import { CreateUserDto } from "../dto/create-user.dto";
import { ReadUserDto } from "../dto/read-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { ChangePasswordDto } from "../dto/change-password.dto";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ReadUserDto> {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll(): Promise<ReadUserDto[]> {
    return this.userService.findAll()
  }

  @Get('profile')
  async getProfile(@Request() req): Promise<ReadUserDto> {
    return this.userService.findOne(req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReadUserDto> {
    return this.userService.findOne(id);
  }

  @Patch("profile")
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto): Promise<ReadUserDto> {
    return this.userService.update(req.user.id, updateUserDto)
  }

  @Patch(":id")
  @Roles(Role.ADMIN)
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto): Promise<ReadUserDto> {
    return this.userService.update(id, updateUserDto)
  }

  @Patch("profile/change-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto): Promise<void> {
    return this.userService.changePassword(req.user.id, changePasswordDto)
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.userService.remove(id);
  }
}
