import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import * as jsonwebtoken from 'jsonwebtoken';
import * as jwkToPem from 'jwk-to-pem';
import { decode } from 'querystring';
import { key } from './keys';

export enum UserGroup  {
  Unauthenticated = "unauthenticated",
  Authenticated = "authenticated",
  Editor = "editor"
}
export enum UserType {
  Editor,
  Visitor,
}

function getUserGroup(decodedToken: any){
  if (!decodedToken) {
    return UserGroup.Unauthenticated
  }
  const groups = decodedToken['cognito:groups'];
  if (!groups || groups.length === 0) {
    return UserGroup.Unauthenticated
  }
  if (groups.includes(UserGroup.Editor)) {
    return UserGroup.Editor
  }
  return UserGroup.Authenticated
}

@Injectable()
export class UserMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function): any {
    if (res.locals.userGroup) {
      next()
      return
    }
    const autoken = req.headers.authorization;
    const token = autoken && autoken.split(' ')[1];
    const pem = jwkToPem(key);
    jsonwebtoken.verify(token, pem, { algorithms: ['RS256'] }, function(
      err,
      decodedToken,
    ) {
      res.locals.userGroup = getUserGroup(decodedToken);
      res.locals.user = decodedToken
      next();
    });
  }
}

