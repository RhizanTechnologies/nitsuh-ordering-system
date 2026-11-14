import { PrismaService } from '../prisma.service';
import { UserRole } from '@prisma/client';
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
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllUsers(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            ordersCreated: number;
            ordersWaitered: number;
            shifts: number;
        };
        name: string;
        employeeCode: string;
        email: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        avatarUrl: string;
    }[]>;
    getUserById(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        employeeCode: string;
        email: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        avatarUrl: string;
    }>;
    createUser(dto: CreateUserDto, creatorId?: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        employeeCode: string;
        email: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        avatarUrl: string;
    }>;
    updateUser(id: string, dto: UpdateUserDto, updaterId?: string): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        employeeCode: string;
        email: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        avatarUrl: string;
    }>;
    resetPin(id: string, newPin: string, modifierId?: string): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        employeeCode: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
    }>;
    resetPassword(id: string, newPass: string, modifierId?: string): Promise<{
        message: string;
    }>;
    toggleStatus(id: string, requesterId: string): Promise<{
        id: string;
        name: string;
        employeeCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    managerOverrideResetPin(managerCred: string, targetUserId: string, newPin: string): Promise<{
        success: boolean;
        message: string;
        user: {
            id: string;
            name: string;
            employeeCode: string;
            pinCode: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        authorizedBy: string;
    }>;
    private generateNextEmployeeCode;
}
