// types/request-with-user.ts
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    role: string;
  };
}