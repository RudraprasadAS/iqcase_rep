import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getCurrentUser(@Request() req) {
    return req.user;
  }

  @Get('user-info')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getUserInfo(@Request() req) {
    return await this.authService.getCurrentUser(req.user.authUserId);
  }
}