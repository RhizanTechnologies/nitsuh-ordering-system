import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
    return this.usersService.getAllUsers(req.user.role);
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

  // Get system-wide role permissions (available for all authenticated terminals to sync)
  @Get('permissions')
  async getRolePermissions() {
    return this.usersService.getRolePermissions();
  }

  // Update system-wide role permissions (Owner only)
  @UseGuards(AuthGuard('jwt'))
  @Patch('permissions')
  async updateRolePermissions(@Req() req: any, @Body() body: { permissions: any }) {
    if (req.user.role !== 'OWNER') {
      throw new ForbiddenException('Only the Owner can customize role permissions and station access');
    }
    return this.usersService.updateRolePermissions(body.permissions, req.user.id);
  }

  // Get specific user details
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getUserById(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER' && req.user.id !== id) {
      throw new ForbiddenException('Unauthorized to view this user');
    }
    return this.usersService.getUserById(id, req.user.role);
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
    return this.usersService.updateUser(id, dto, req.user.id, req.user.role);
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
    return this.usersService.resetPin(id, body.pinCode, req.user.id, req.user.role);
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
    return this.usersService.toggleStatus(id, req.user.id, req.user.role);
  }

  // Delete or archive staff member (BUG-007)
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteUser(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER') {
      throw new ForbiddenException('Only Owner and General Manager can delete or archive staff');
    }
    return this.usersService.deleteUser(id, req.user.id, req.user.role);
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

  // Public: Submit PIN / Password reset request from login screen
  @Post('reset-request')
  async createResetRequest(
    @Body() body: { userId?: string; identifier?: string; note?: string },
  ) {
    return this.usersService.createResetRequest(body);
  }

  // Manager & Owner: View all pending and resolved reset requests
  @UseGuards(AuthGuard('jwt'))
  @Get('reset-requests')
  async getResetRequests(@Req() req: any) {
    if (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER') {
      throw new ForbiddenException('Only Owner and General Manager can view reset requests');
    }
    return this.usersService.getResetRequests(req.user.role);
  }

  // Manager & Owner: Resolve reset request (generate new PIN / password or dismiss)
  @UseGuards(AuthGuard('jwt'))
  @Post('resolve-reset-request/:id')
  async resolveResetRequest(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { action: 'GENERATE_PIN' | 'GENERATE_PASSWORD' | 'DISMISS' },
  ) {
    if (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER') {
      throw new ForbiddenException('Only Owner and General Manager can resolve reset requests');
    }
    return this.usersService.resolveResetRequest(id, body.action, {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role,
    });
  }

  // Manager & Owner: Instant 1-click PIN generation for any staff member
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/generate-pin')
  async generatePinForUser(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER') {
      throw new ForbiddenException('Only Owner and General Manager can generate staff PINs');
    }
    return this.usersService.generateRandomPinForUser(id, {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role,
    });
  }

  // Authenticated Employee: Change own PIN or password from their user profile
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile/change-credentials')
  async selfChangeCredentials(
    @Req() req: any,
    @Body()
    body: {
      currentPin?: string;
      newPin?: string;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    return this.usersService.selfChangeCredentials(req.user.id, body);
  }
}
