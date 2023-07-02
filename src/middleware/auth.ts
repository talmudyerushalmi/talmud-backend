import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserGroup } from './userType';

@Injectable()
export class EditorMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void): any {
    const userGroup = res.locals.userGroup;
    if (userGroup == UserGroup.Editor) {
      next();
    } else {
      res.status(401).json({
        error: 'Invalid request!',
      });
    }
  }
}

export class AuthenticatedMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void): any {
    const userGroup = res.locals.userGroup;
    if (userGroup !== UserGroup.Unauthenticated) {
      next();
    } else {
      res.status(401).json({
        error: 'Invalid request! Unauthenticated',
      });
    }
  }
}
