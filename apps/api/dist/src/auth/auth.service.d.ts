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
            role: string;
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
            role: string;
            avatarUrl: string;
        };
    }>;
    getStaffList(): Promise<{
        role: string;
        id: string;
        name: string;
        employeeCode: string;
        email: string;
        customRole: string;
        avatarUrl: string;
    }[]>;
}
