import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import * as jsonwebtoken from 'jsonwebtoken';
import * as jwkToPem from 'jwk-to-pem';
import { key } from './keys';

export enum UserType {
  Editor,
  Visitor,
}
@Injectable()
export class UserMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function): any {
    const autoken = req.headers.authorization;
    const token = autoken && autoken.split(' ')[1];
    const pem = jwkToPem(key);
    jsonwebtoken.verify(token, pem, { algorithms: ['RS256'] }, function(
      err,
      decodedToken,
    ) {
      res.locals.userType = decodedToken ? UserType.Editor : UserType.Visitor
      res.locals.user = decodedToken
      next();
    });
  }
}
