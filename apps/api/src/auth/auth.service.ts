import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async loginWithPassword(identifier: string, pass: string) {
    const trimmed = identifier?.trim();
    if (!trimmed) {
      throw new UnauthorizedException('Please enter your Employee Code, Name, or Email');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: trimmed.toLowerCase() },
          { employeeCode: trimmed.toUpperCase() },
          { name: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid identifier or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been disabled by the Owner. Please contact management.');
    }

    const matches = await bcrypt.compare(pass, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      employeeCode: user.employeeCode,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        employeeCode: user.employeeCode,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // Fast 4-6 digit touch PIN switch with optional specific employee targeting
  async loginWithPin(pin: string, userId?: string) {
    if (userId) {
      const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });
      if (targetUser && !targetUser.isActive) {
        throw new UnauthorizedException('This staff account is currently disabled. Please contact the Owner.');
      }
    }

    const whereClause: any = { pinCode: pin, isActive: true };
    if (userId) {
      whereClause.id = userId;
    }

    const user = await this.prisma.user.findFirst({
      where: whereClause,
    });

    if (!user) {
      const disabledWithPin = await this.prisma.user.findFirst({
        where: { pinCode: pin, isActive: false },
      });
      if (disabledWithPin) {
        throw new UnauthorizedException('This account has been disabled by the Owner. Please contact management.');
      }
      throw new UnauthorizedException(
        userId ? 'Incorrect PIN for the selected employee' : 'Invalid employee PIN',
      );
    }

    // Managers and Owners must log in via Email/Password tab, not PIN dropdown
    if (user.role === 'OWNER' || user.role === 'MANAGER') {
      throw new UnauthorizedException(
        'Managers and Owners must sign in using code/email and password.',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      employeeCode: user.employeeCode,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        employeeCode: user.employeeCode,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async getStaffList() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { notIn: ['OWNER', 'MANAGER'] },
      },
      select: {
        id: true,
        name: true,
        employeeCode: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}
