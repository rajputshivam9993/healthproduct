import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../entities/enums';

export interface TokenPayload {
  id: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Issues and verifies JWTs (Req 3). Access tokens use the access secret/TTL
 * (15m); refresh tokens are signed with a separate secret and longer TTL (7d).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issueTokens(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessTtl'),
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: this.config.get<string>('jwt.refreshTtl'),
    });
    return { accessToken, refreshToken };
  }

  /** Verifies a refresh token's signature/expiry and returns its payload. */
  verifyRefresh(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync<TokenPayload>(token, {
      secret: this.config.get<string>('jwt.refreshSecret'),
    });
  }
}
