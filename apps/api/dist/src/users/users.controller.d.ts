import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getAllUsers(req: any): Promise<{
        id: string;
        name: string;
        employeeCode: string;
        email: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        avatarUrl: string;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            ordersCreated: number;
            ordersWaitered: number;
            shifts: number;
        };
    }[]>;
    createUser(req: any, dto: CreateUserDto): Promise<{
        id: string;
        name: string;
        employeeCode: string;
        email: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        avatarUrl: string;
        createdAt: Date;
    }>;
    getUserById(req: any, id: string): Promise<{
        id: string;
        name: string;
        employeeCode: string;
        email: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        avatarUrl: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateUser(req: any, id: string, dto: UpdateUserDto): Promise<{
        id: string;
        name: string;
        employeeCode: string;
        email: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        avatarUrl: string;
        updatedAt: Date;
    }>;
    resetPin(req: any, id: string, body: {
        pinCode: string;
    }): Promise<{
        id: string;
        name: string;
        employeeCode: string;
        pinCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        updatedAt: Date;
    }>;
    resetPassword(req: any, id: string, body: {
        password: string;
    }): Promise<{
        message: string;
    }>;
    toggleStatus(req: any, id: string): Promise<{
        id: string;
        name: string;
        employeeCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
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
