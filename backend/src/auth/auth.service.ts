import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private jwtAccessSecret: string;
  private jwtRefreshSecret: string;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.jwtAccessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'access_secret_key_12345';
    this.jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'refresh_secret_key_67890';
  }

  async validateUser(email: string, pass: string): Promise<UserDocument> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  async login(user: UserDocument) {
    if (user.role !== 'ADMIN' && user.role !== 'TECHNICIAN') {
      throw new ForbiddenException('Invalid user role');
    }

    const userId = (user._id as any).toString();
    const payload = { email: user.email, sub: userId, role: user.role };
    const tokens = await this.generateTokens(payload);

    await this.updateRefreshToken(userId, tokens.refreshToken);
    return tokens;
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Access denied - Session not found');
    }

    // Verify token signature first
    try {
      this.jwtService.verify(refreshToken, { secret: this.jwtRefreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Match stored hash
    const isMatch = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!isMatch) {
      // Refresh token reuse detected — revoke session
      user.hashedRefreshToken = null;
      await user.save();
      throw new ForbiddenException('Token reuse detected. Session revoked.');
    }

    const resolvedUserId = (user._id as any).toString();
    const payload = { email: user.email, sub: resolvedUserId, role: user.role };
    const tokens = await this.generateTokens(payload);
    await this.updateRefreshToken(resolvedUserId, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    const user = await this.usersService.findById(userId);
    if (user) {
      user.hashedRefreshToken = null;
      await user.save();
    }
    return { success: true };
  }

  private async generateTokens(payload: {
    email: string;
    sub: string;
    role: string;
  }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtAccessSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtRefreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const salt = await bcrypt.genSalt(10);
    user.hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await user.save();
  }
}
