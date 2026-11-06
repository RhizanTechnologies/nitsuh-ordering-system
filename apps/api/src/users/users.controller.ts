import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // List all users for Owner / Manager
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllUsers(@Req() req: any) {
    if (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER') {
      throw new ForbiddenException('Only Owner and General Manager can access User Management');
    }
    return this.usersService.getAllUsers();
  }

  // Register new staff member (No email/phone required)
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createUser(@Req() req: any, @Body() dto: CreateUserDto) {
    if (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER') {
      throw new ForbiddenException('Only Owner and General Manager can register staff');
    }
    return this.usersService.createUser(dto, req.user.id);
  }

  // Get specific user details
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getUserById(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER' && req.user.id !== id) {
      throw new ForbiddenException('Unauthorized to view this user');
    }
    return this.usersService.getUserById(id);
  }

  // Update staff profile
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateUser(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    if (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER') {
      throw new ForbiddenException('Only Owner and General Manager can modify staff profiles');
    }
    return this.usersService.updateUser(id, dto, req.user.id);
  }

  // Reset 4-digit PIN for staff member
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/pin')
  async resetPin(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { pinCode: string },
  ) {
    if (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER') {
      throw new ForbiddenException('Only Owner and General Manager can reset staff PIN codes');
    }
    return this.usersService.resetPin(id, body.pinCode, req.user.id);
  }

  // Reset manager password
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/password')
  async resetPassword(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    if (req.user.role !== 'OWNER') {
      throw new ForbiddenException('Only the Owner can reset management passwords');
    }
    return this.usersService.resetPassword(id, body.password, req.user.id);
  }

  // Toggle active / inactive status
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/toggle-status')
  async toggleStatus(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER') {
      throw new ForbiddenException('Only Owner and General Manager can toggle staff status');
    }
    return this.usersService.toggleStatus(id, req.user.id);
  }

  // Terminal Forgotten PIN Reset (Called from Login Screen)
  // Shift Manager or Owner enters their manager PIN/password to authorize instant PIN reset on the spot
  @Post('terminal-reset-pin')
  async terminalResetPin(
    @Body()
    body: {
      managerCredential: string;
      targetUserId: string;
      newPin: string;
    },
  ) {
    return this.usersService.managerOverrideResetPin(
      body.managerCredential,
      body.targetUserId,
      body.newPin,
    );
  }
}
