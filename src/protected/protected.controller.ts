import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Protected')
@ApiBearerAuth('JWT-auth')
@Controller('protected')
@UseGuards(JwtAuthGuard)
export class ProtectedController {
  @ApiOperation({ summary: 'Get protected resource' })
  @Get('resource')
  getProtectedResource() {
    return { message: 'This is a protected resource' };
  }
}
