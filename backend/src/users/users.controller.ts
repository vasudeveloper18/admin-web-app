import { Controller, Get, Patch, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @Roles('ADMIN', 'TECHNICIAN')
  @SuccessMessage('Profile retrieved successfully')
  @ApiOperation({
    summary: 'Profile (mobile + admin)',
    description: 'Returns current user (id, email, name, role). **Mobile:** TECHNICIAN after login.',
  })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Req() req: any) {
    const userId = req.user.sub;
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return user;
  }

  @Patch('me')
  @Roles('ADMIN', 'TECHNICIAN')
  @SuccessMessage('Profile updated successfully')
  @ApiOperation({
    summary: 'Update profile (admin web)',
    description: 'Update first name, last name, and email for the logged-in user.',
  })
  @ApiResponse({ status: 200, description: 'Updated profile.' })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  async updateMe(@Req() req: { user: { sub: string } }, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  @Get('technicians')
  @Roles('ADMIN')
  @SuccessMessage('Technicians retrieved successfully')
  @ApiOperation({ summary: 'Get list of all technicians' })
  @ApiResponse({ status: 200, description: 'List of technicians retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTechnicians() {
    return this.usersService.findTechnicians();
  }
}
