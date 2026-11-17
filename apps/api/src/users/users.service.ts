import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export interface CreateUserDto {
  name: string;
  employeeCode?: string;
  role: UserRole;
  pinCode: string;
  password?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export interface UpdateUserDto {
  name?: string;
  employeeCode?: string;
  role?: UserRole;
  avatarUrl?: string;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // List all staff with station workload stats
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        employeeCode: true,
        email: true,
        role: true,
        pinCode: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ordersCreated: true,
            ordersWaitered: true,
            shifts: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        email: true,
        role: true,
        pinCode: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  // Register new staff member (no email or phone required)
  async createUser(dto: CreateUserDto, creatorId?: string) {
    if (dto.role === UserRole.OWNER) {
      throw new BadRequestException('Owner accounts cannot be created via staff registration. Owner is system reserved.');
    }

    const trimmedName = dto.name?.trim();
    if (!trimmedName) {
      throw new BadRequestException('Employee name is required');
    }

    const trimmedPin = dto.pinCode?.trim();
    if (!trimmedPin || !/^\d{4,6}$/.test(trimmedPin)) {
      throw new BadRequestException('PIN code must be 4 to 6 digits');
    }

    // Check if PIN is already in use by an active employee
    const existingPinUser = await this.prisma.user.findFirst({
      where: { pinCode: trimmedPin, isActive: true },
    });
    if (existingPinUser) {
      throw new BadRequestException(
        `PIN code is already assigned to "${existingPinUser.name}". Each active staff must have a unique PIN.`,
      );
    }

    // Generate or validate employee code
    let code = dto.employeeCode?.trim()?.toUpperCase();
    if (!code) {
      code = await this.generateNextEmployeeCode();
    } else {
      const existingCode = await this.prisma.user.findUnique({
        where: { employeeCode: code },
      });
      if (existingCode) {
        throw new BadRequestException(`Employee Code "${code}" is already taken`);
      }
    }

    // Internal system email generated from employee code
    const internalEmail = `${code.toLowerCase().replace(/[^a-z0-9]/g, '')}@nitsuh.local`;

    // Hash password (default to nitsuh123 if not provided)
    const rawPass = dto.password?.trim() || 'nitsuh123';
    const passwordHash = await bcrypt.hash(rawPass, 10);

    const user = await this.prisma.user.create({
      data: {
        name: trimmedName,
        employeeCode: code,
        email: internalEmail,
        pinCode: trimmedPin,
        passwordHash,
        role: dto.role || UserRole.CASHIER,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        avatarUrl: dto.avatarUrl || null,
      },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        email: true,
        role: true,
        pinCode: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    // Audit log if creator provided
    if (creatorId) {
      await this.prisma.auditLog
        .create({
          data: {
            userId: creatorId,
            action: 'CREATE_USER',
            entityName: 'User',
            entityId: user.id,
            newValue: { name: user.name, role: user.role, code: user.employeeCode },
            reason: `Registered new employee ${user.name} (${user.role})`,
          },
        })
        .catch(() => {});
    }

    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto, updaterId?: string) {
    const existing = await this.getUserById(id);

    const updateData: any = {};
    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      if (!trimmed) throw new BadRequestException('Name cannot be empty');
      updateData.name = trimmed;
    }

    if (dto.role !== undefined) {
      if (dto.role === UserRole.OWNER && existing.role !== UserRole.OWNER) {
        throw new BadRequestException('Staff roles cannot be changed to Owner');
      }
      updateData.role = dto.role;
    }

    if (dto.avatarUrl !== undefined) {
      updateData.avatarUrl = dto.avatarUrl;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    if (dto.employeeCode !== undefined) {
      const code = dto.employeeCode.trim().toUpperCase();
      if (code !== existing.employeeCode) {
        const conflict = await this.prisma.user.findUnique({
          where: { employeeCode: code },
        });
        if (conflict && conflict.id !== id) {
          throw new BadRequestException(`Employee Code "${code}" is already taken`);
        }
        updateData.employeeCode = code;
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        employeeCode: true,
        email: true,
        role: true,
        pinCode: true,
        isActive: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  // Reset PIN for any staff member
  async resetPin(id: string, newPin: string, modifierId?: string) {
    const trimmedPin = newPin?.trim();
    if (!trimmedPin || !/^\d{4,6}$/.test(trimmedPin)) {
      throw new BadRequestException('PIN code must be between 4 and 6 digits');
    }

    // Check uniqueness across other active users
    const conflict = await this.prisma.user.findFirst({
      where: { pinCode: trimmedPin, isActive: true, NOT: { id } },
    });
    if (conflict) {
      throw new BadRequestException(
        `PIN is already assigned to "${conflict.name}". Choose a distinct PIN code.`,
      );
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { pinCode: trimmedPin },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        role: true,
        pinCode: true,
        updatedAt: true,
      },
    });

    if (modifierId) {
      await this.prisma.auditLog
        .create({
          data: {
            userId: modifierId,
            action: 'RESET_USER_PIN',
            entityName: 'User',
            entityId: id,
            reason: `PIN reset for ${updated.name}`,
          },
        })
        .catch(() => {});
    }

    return updated;
  }

  // Reset Manager/Owner Password
  async resetPassword(id: string, newPass: string, modifierId?: string) {
    const trimmed = newPass?.trim();
    if (!trimmed || trimmed.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const passwordHash = await bcrypt.hash(trimmed, 10);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true, name: true, employeeCode: true, role: true },
    });

    return { message: `Password successfully updated for ${updated.name}` };
  }

  // Toggle active status
  async toggleStatus(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new BadRequestException('You cannot deactivate your own account while logged in');
    }

    const user = await this.getUserById(id);
    const newStatus = !user.isActive;

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: newStatus },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        role: true,
        isActive: true,
      },
    });

    return updated;
  }

  // On-terminal forgotten PIN reset by authorized Shift Manager / Owner
  async managerOverrideResetPin(managerCred: string, targetUserId: string, newPin: string) {
    const trimmedPin = newPin?.trim();
    if (!trimmedPin || !/^\d{4,6}$/.test(trimmedPin)) {
      throw new BadRequestException('New PIN must be 4 to 6 numeric digits');
    }

    // Verify manager credentials (either their quick PIN or password)
    const manager = await this.prisma.user.findFirst({
      where: {
        role: { in: [UserRole.OWNER, UserRole.MANAGER] },
        isActive: true,
        OR: [{ pinCode: managerCred.trim() }],
      },
    });

    let authorizedManager = manager;

    // If not found by PIN, check if manager used password
    if (!authorizedManager) {
      const managers = await this.prisma.user.findMany({
        where: {
          role: { in: [UserRole.OWNER, UserRole.MANAGER] },
          isActive: true,
        },
      });

      for (const m of managers) {
        const matches = await bcrypt.compare(managerCred, m.passwordHash);
        if (matches) {
          authorizedManager = m;
          break;
        }
      }
    }

    if (!authorizedManager) {
      throw new UnauthorizedException('Manager authorization failed. Incorrect PIN or Password.');
    }

    // Check if new PIN conflicts with another active user
    const conflict = await this.prisma.user.findFirst({
      where: { pinCode: trimmedPin, isActive: true, NOT: { id: targetUserId } },
    });
    if (conflict) {
      throw new BadRequestException(
        `The chosen PIN is already used by "${conflict.name}". Please choose another PIN.`,
      );
    }

    const updatedTarget = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { pinCode: trimmedPin },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        role: true,
        pinCode: true,
      },
    });

    // Record audit log
    await this.prisma.auditLog
      .create({
        data: {
          userId: authorizedManager.id,
          action: 'TERMINAL_OVERRIDE_PIN_RESET',
          entityName: 'User',
          entityId: targetUserId,
          reason: `Shift Manager ${authorizedManager.name} authorized terminal PIN reset for ${updatedTarget.name}`,
        },
      })
      .catch(() => {});

    return {
      success: true,
      message: `PIN for ${updatedTarget.name} has been successfully reset!`,
      user: updatedTarget,
      authorizedBy: authorizedManager.name,
    };
  }

  // Create reset request (called from Login Screen by employee who forgot PIN/password)
  async createResetRequest(dto: { userId?: string; identifier?: string; note?: string }) {
    let user = null;
    if (dto.userId) {
      user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    } else if (dto.identifier) {
      const trimmed = dto.identifier.trim();
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { employeeCode: trimmed.toUpperCase() },
            { name: { equals: trimmed, mode: 'insensitive' } },
            { email: trimmed.toLowerCase() },
          ],
        },
      });
    }

    if (!user || !user.isActive) {
      throw new NotFoundException('Active employee profile not found. Please verify your name or employee code.');
    }

    // Check if an unresolved request already exists
    const existing = await this.prisma.auditLog.findFirst({
      where: {
        entityName: 'User',
        entityId: user.id,
        action: 'CREDENTIAL_RESET_REQUEST',
        newValue: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return {
        success: true,
        alreadyPending: true,
        message: `A reset request for ${user.name} is already logged and pending. Please inform your Shift Manager or Owner.`,
      };
    }

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREDENTIAL_RESET_REQUEST',
        entityName: 'User',
        entityId: user.id,
        oldValue: {
          status: 'PENDING',
          requestedAt: new Date().toISOString(),
          employeeName: user.name,
          employeeCode: user.employeeCode,
          role: user.role,
          note: dto.note?.trim() || 'Forgot credentials / PIN',
        },
        newValue: null,
        reason: `Credential reset requested for ${user.name} (${user.role})`,
      },
    });

    return {
      success: true,
      message: `Reset request logged for ${user.name}. Your Shift Manager or Owner can generate your new credentials in Staff Management.`,
    };
  }

  // Get all reset requests for Manager & Owner
  async getResetRequests() {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: 'CREDENTIAL_RESET_REQUEST',
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            role: true,
            avatarUrl: true,
            isActive: true,
            pinCode: true,
          },
        },
      },
    });

    return logs.map((log) => {
      const oldVal = (log.oldValue as any) || {};
      const newVal = (log.newValue as any) || null;
      return {
        id: log.id,
        userId: log.entityId,
        user: log.user,
        status: newVal ? newVal.status || 'RESOLVED' : 'PENDING',
        requestedAt: oldVal.requestedAt || log.createdAt,
        note: oldVal.note || log.reason,
        role: log.user?.role || oldVal.role,
        employeeCode: log.user?.employeeCode || oldVal.employeeCode,
        employeeName: log.user?.name || oldVal.employeeName,
        resolvedAt: newVal?.resolvedAt || null,
        resolvedBy: newVal?.resolvedBy || null,
        generatedCredential: newVal?.generatedCredential || null,
        credentialType: newVal?.credentialType || null,
      };
    });
  }

  // Resolve a reset request by generating a new PIN or password
  async resolveResetRequest(
    requestId: string,
    action: 'GENERATE_PIN' | 'GENERATE_PASSWORD' | 'DISMISS',
    resolver: { id: string; name: string },
  ) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!log || log.action !== 'CREDENTIAL_RESET_REQUEST') {
      throw new NotFoundException('Reset request not found');
    }

    if (action === 'DISMISS') {
      await this.prisma.auditLog.update({
        where: { id: requestId },
        data: {
          newValue: {
            status: 'DISMISSED',
            resolvedAt: new Date().toISOString(),
            resolvedBy: resolver.name,
          },
        },
      });
      return { success: true, message: 'Request dismissed' };
    }

    const targetUser = log.user;
    if (!targetUser) {
      throw new NotFoundException('Associated staff member not found');
    }

    if (action === 'GENERATE_PIN') {
      // Generate a unique 4-digit PIN
      let genPin = '';
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 30) {
        genPin = Math.floor(1000 + Math.random() * 9000).toString();
        const conflict = await this.prisma.user.findFirst({
          where: { pinCode: genPin, isActive: true, NOT: { id: targetUser.id } },
        });
        if (!conflict) isUnique = true;
        attempts++;
      }

      await this.prisma.user.update({
        where: { id: targetUser.id },
        data: { pinCode: genPin },
      });

      await this.prisma.auditLog.update({
        where: { id: requestId },
        data: {
          newValue: {
            status: 'RESOLVED',
            resolvedAt: new Date().toISOString(),
            resolvedBy: resolver.name,
            generatedCredential: genPin,
            credentialType: 'PIN',
          },
        },
      });

      return {
        success: true,
        type: 'PIN',
        credential: genPin,
        message: `New PIN for ${targetUser.name} generated: ${genPin}`,
      };
    } else {
      // GENERATE_PASSWORD
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const generatedPass = `Nitsuh#${randomDigits}`;
      const passwordHash = await bcrypt.hash(generatedPass, 10);

      await this.prisma.user.update({
        where: { id: targetUser.id },
        data: { passwordHash },
      });

      await this.prisma.auditLog.update({
        where: { id: requestId },
        data: {
          newValue: {
            status: 'RESOLVED',
            resolvedAt: new Date().toISOString(),
            resolvedBy: resolver.name,
            generatedCredential: generatedPass,
            credentialType: 'PASSWORD',
          },
        },
      });

      return {
        success: true,
        type: 'PASSWORD',
        credential: generatedPass,
        message: `New temporary password for ${targetUser.name} generated: ${generatedPass}`,
      };
    }
  }

  // Direct 1-click PIN generation for Manager/Owner in Staff Management
  async generateRandomPinForUser(userId: string, resolver: { id: string; name: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Staff member not found');

    let genPin = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 30) {
      genPin = Math.floor(1000 + Math.random() * 9000).toString();
      const conflict = await this.prisma.user.findFirst({
        where: { pinCode: genPin, isActive: true, NOT: { id: userId } },
      });
      if (!conflict) isUnique = true;
      attempts++;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { pinCode: genPin },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: resolver.id,
        action: 'GENERATE_USER_PIN',
        entityName: 'User',
        entityId: userId,
        reason: `${resolver.name} generated new PIN for ${user.name}`,
      },
    }).catch(() => {});

    return {
      success: true,
      pinCode: genPin,
      message: `Generated PIN ${genPin} for ${user.name}`,
    };
  }

  // Employee self-service change PIN / password from their own profile
  async selfChangeCredentials(
    userId: string,
    dto: {
      currentPin?: string;
      newPin?: string;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User profile not found');

    const updateData: any = {};
    const updatedItems: string[] = [];

    // Changing PIN
    if (dto.newPin) {
      const trimmedPin = dto.newPin.trim();
      if (!/^\d{4,6}$/.test(trimmedPin)) {
        throw new BadRequestException('New PIN must be 4 to 6 numeric digits');
      }

      // If user has a current PIN and isn't OWNER, check currentPin
      if (user.role !== UserRole.OWNER) {
        if (!dto.currentPin || dto.currentPin.trim() !== user.pinCode) {
          throw new UnauthorizedException('Current PIN is incorrect');
        }
      }

      // Check conflict with other users
      const conflict = await this.prisma.user.findFirst({
        where: { pinCode: trimmedPin, isActive: true, NOT: { id: userId } },
      });
      if (conflict) {
        throw new BadRequestException('This PIN is already in use by another staff member.');
      }

      updateData.pinCode = trimmedPin;
      updatedItems.push('PIN');
    }

    // Changing Password
    if (dto.newPassword) {
      const trimmedPass = dto.newPassword.trim();
      if (trimmedPass.length < 6) {
        throw new BadRequestException('New password must be at least 6 characters');
      }

      if (!dto.currentPassword) {
        throw new UnauthorizedException('Current password is required');
      }

      const match = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!match) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      updateData.passwordHash = await bcrypt.hash(trimmedPass, 10);
      updatedItems.push('Password');
    }

    if (updatedItems.length === 0) {
      throw new BadRequestException('No new PIN or password provided');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        employeeCode: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SELF_CHANGE_CREDENTIALS',
        entityName: 'User',
        entityId: userId,
        reason: `Employee changed their own ${updatedItems.join(' & ')}`,
      },
    }).catch(() => {});

    return {
      success: true,
      message: `${updatedItems.join(' & ')} changed successfully!`,
      user: updatedUser,
    };
  }

  // Auto-generate next employee code like EMP-009
  private async generateNextEmployeeCode(): Promise<string> {
    const users = await this.prisma.user.findMany({
      where: { employeeCode: { startsWith: 'EMP-' } },
      select: { employeeCode: true },
    });

    let maxNum = 0;
    for (const u of users) {
      if (u.employeeCode) {
        const match = u.employeeCode.match(/EMP-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    const nextNum = maxNum + 1;
    return `EMP-${String(nextNum).padStart(3, '0')}`;
  }
}
