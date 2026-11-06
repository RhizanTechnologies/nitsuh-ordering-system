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
