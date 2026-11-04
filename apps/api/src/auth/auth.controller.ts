import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.loginWithPassword(body.email, body.password);
  }

  @Post('login-pin')
  async loginWithPin(@Body() body: { pin: string }) {
    return this.authService.loginWithPin(body.pin);
  }

  @Get('staff')
  async getStaff() {
    return this.authService.getStaffList();
  }
}
