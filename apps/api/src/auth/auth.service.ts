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

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid identifier or inactive account');
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
    const whereClause: any = { pinCode: pin, isActive: true };
    if (userId) {
      whereClause.id = userId;
    }

    const user = await this.prisma.user.findFirst({
      where: whereClause,
    });

    if (!user) {
      throw new UnauthorizedException(
        userId ? 'Incorrect PIN for the selected employee' : 'Invalid employee PIN',
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
      where: { isActive: true },
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
