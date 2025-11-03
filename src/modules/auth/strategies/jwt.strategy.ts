import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

import { cookieExtractor } from '../utils/cookie-extractor';

export interface JwtPayload {
  email: string;
  sub: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      ignoreExpiration: false,
      jwtFromRequest: cookieExtractor,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  validate(payload: JwtPayload) {
    return {
      email: payload.email,
      id: payload.sub,
      username: payload.username,
    };
  }
}
