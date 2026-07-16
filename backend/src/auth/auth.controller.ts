import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @SuccessMessage('Logged in successfully')
  @ApiOperation({ summary: 'Login as an Admin' })
  @ApiResponse({ status: 200, description: 'Authentication successful. Returns access and refresh tokens.' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiResponse({ status: 403, description: 'Access denied - ADMIN role required' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    return this.authService.login(user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @SuccessMessage('Tokens rotated successfully')
  @ApiOperation({ summary: 'Rotate JWT Access and Refresh Tokens' })
  @ApiResponse({ status: 200, description: 'Tokens rotated successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 403, description: 'Token reuse detected or session not found' })
  async refresh(@Body() refreshDto: RefreshDto) {
    try {
      const decoded = this.jwtService.decode(refreshDto.refreshToken) as any;
      if (!decoded || !decoded.sub) {
        throw new UnauthorizedException('Invalid refresh token payload');
      }
      return await this.authService.refreshTokens(decoded.sub, refreshDto.refreshToken);
    } catch (e) {
      if (e instanceof UnauthorizedException || e instanceof ForbiddenException) {
        throw e;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @SuccessMessage('Logged out successfully')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req: any) {
    const userId = req.user.sub;
    return this.authService.logout(userId);
  }
}
