import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { KordUnauthorizedException } from '@/common/exceptions/kord.exceptions';

import { AuthService } from '../auth.service';

export interface ValidatedUser {
  email: string;
  id: number;
  username: string;
}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'usernameOrEmail',
    });
  }

  async validate(
    usernameOrEmail: string,
    password: string,
  ): Promise<ValidatedUser> {
    const user = await this.authService.validateUser(usernameOrEmail, password);
    if (!user) {
      throw new KordUnauthorizedException('Invalid credentials');
    }
    return user as ValidatedUser;
  }
}
