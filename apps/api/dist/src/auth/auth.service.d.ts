import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    loginWithPassword(identifier: string, pass: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            employeeCode: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            avatarUrl: string;
        };
    }>;
    loginWithPin(pin: string, userId?: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            employeeCode: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            avatarUrl: string;
        };
    }>;
    getStaffList(): Promise<{
        id: string;
        name: string;
        employeeCode: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string;
    }[]>;
}
