import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import { AuthGuard } from './auth.guard';
import type { User } from '../../user/entities/user.entity';

@Injectable()
export class AdminGuard extends AuthGuard implements CanActivate {
  constructor(
    jwtService: any,
    private userRepository: Repository<User>,
  ) {
    super(jwtService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) return false;

    const request = context.switchToHttp().getRequest();
    const user = await this.userRepository.findOne({
      where: { id: request.user.id },
    });

    if (!user?.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
