import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getAllUsers(req: any): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            ordersCreated: number;
            ordersWaitered: number;
            shifts: number;
        };
        employeeCode: string;
        email: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string;
    }[]>;
    createUser(req: any, dto: CreateUserDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        employeeCode: string;
        email: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string;
    }>;
    getUserById(req: any, id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        employeeCode: string;
        email: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string;
    }>;
    updateUser(req: any, id: string, dto: UpdateUserDto): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        updatedAt: Date;
        employeeCode: string;
        email: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string;
    }>;
    resetPin(req: any, id: string, body: {
        pinCode: string;
    }): Promise<{
        id: string;
        name: string;
        updatedAt: Date;
        employeeCode: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
    }>;
    resetPassword(req: any, id: string, body: {
        password: string;
    }): Promise<{
        message: string;
    }>;
    toggleStatus(req: any, id: string): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        employeeCode: string;
        role: import("@prisma/client").$Enums.UserRole;
    }>;
    terminalResetPin(body: {
        managerCredential: string;
        targetUserId: string;
        newPin: string;
    }): Promise<{
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
}
