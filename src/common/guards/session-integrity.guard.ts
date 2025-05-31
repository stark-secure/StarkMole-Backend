import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

interface User {
  id: string;
}

interface CustomRequest extends Request {
  user?: User;
}

interface SessionData {
  duration: number;
  inputs?: Array<{ timestamp: number }>;
}

@Injectable()
export class SessionIntegrityGuard implements CanActivate {
  private readonly logger = new Logger(SessionIntegrityGuard.name);
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<CustomRequest>();
    const sessionData = request.body as SessionData;
    // Basic integrity checks
    if (!this.validateSessionTiming(sessionData)) {
      this.logger.warn('Session timing validation failed', {
        userId: request.user?.id,
        duration: sessionData.duration,
        inputCount: sessionData.inputs?.length,
      });
      throw new BadRequestException('Invalid session timing detected');
    }

    if (!this.validateInputSequence(sessionData.inputs)) {
      this.logger.warn('Input sequence validation failed', {
        userId: request.user?.id,
      });
      throw new BadRequestException('Invalid input sequence detected');
    }

    return true;
  }

  private validateSessionTiming(sessionData: SessionData): boolean {
    const { duration, inputs } = sessionData;

    if (!inputs || inputs.length === 0) return true;

    // Check if duration matches input timestamps
    const firstInput = Math.min(...inputs.map((i) => i.timestamp));
    const lastInput = Math.max(...inputs.map((i) => i.timestamp));
    const actualDuration = lastInput - firstInput;

    // Allow 10% tolerance
    const tolerance = duration * 0.1;
    return Math.abs(duration - actualDuration) <= tolerance;
  }

  private validateInputSequence(
    inputs: Array<{ timestamp: number }> | undefined,
  ): boolean {
    if (!inputs || inputs.length === 0) return true;

    // Check if timestamps are in ascending order
    for (let i = 1; i < inputs.length; i++) {
      if (inputs[i].timestamp < inputs[i - 1].timestamp) {
        return false;
      }
    }

    // Check for unrealistic input frequency (max 100 inputs per second)
    const timeWindows = new Map<number, number>();
    for (const input of inputs) {
      const second = Math.floor(input.timestamp / 1000);
      timeWindows.set(second, (timeWindows.get(second) || 0) + 1);
      if ((timeWindows.get(second) || 0) > 100) {
        return false;
      }
    }

    return true;
  }
}
