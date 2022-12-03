import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import * as jsonwebtoken from 'jsonwebtoken';
import * as jwkToPem from 'jwk-to-pem';
import { key } from './keys';
import { UserGroup } from './userType';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function): any {
    const userGroup = res.locals.userGroup;
    if (userGroup == UserGroup.Editor) {
      next();
    } else {
      res.status(401).json({
        error: new Error('Invalid request!'),
      });
    }
  }
}
