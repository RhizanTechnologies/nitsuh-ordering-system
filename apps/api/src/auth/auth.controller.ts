import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email?: string; identifier?: string; password: string }) {
    const ident = body.identifier || body.email || '';
    return this.authService.loginWithPassword(ident, body.password);
  }

  @Post('login-pin')
  async loginWithPin(@Body() body: { pin: string; userId?: string }) {
    return this.authService.loginWithPin(body.pin, body.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Req() req: any) {
    return req.user;
  }

  @Get('staff')
  async getStaff() {
    return this.authService.getStaffList();
  }
}
