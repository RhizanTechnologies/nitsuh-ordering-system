import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getAllUsers(req: any): Promise<{
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
    createUser(req: any, dto: CreateUserDto): Promise<{
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
    getUserById(req: any, id: string): Promise<{
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
    updateUser(req: any, id: string, dto: UpdateUserDto): Promise<{
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
    resetPin(req: any, id: string, body: {
        pinCode: string;
    }): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
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
        employeeCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    deleteUser(req: any, id: string): Promise<{
        message: string;
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
    createResetRequest(body: {
        userId?: string;
        identifier?: string;
        note?: string;
    }): Promise<{
        success: boolean;
        alreadyPending: boolean;
        message: string;
    } | {
        success: boolean;
        message: string;
        alreadyPending?: undefined;
    }>;
    getResetRequests(req: any): Promise<{
        id: string;
        userId: string;
        user: {
            id: string;
            name: string;
            employeeCode: string;
            pinCode: string;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
            avatarUrl: string;
        };
        status: any;
        requestedAt: any;
        note: any;
        role: any;
        employeeCode: any;
        employeeName: any;
        resolvedAt: any;
        resolvedBy: any;
        generatedCredential: any;
        credentialType: any;
    }[]>;
    resolveResetRequest(req: any, id: string, body: {
        action: 'GENERATE_PIN' | 'GENERATE_PASSWORD' | 'DISMISS';
    }): Promise<{
        success: boolean;
        message: string;
        type?: undefined;
        credential?: undefined;
    } | {
        success: boolean;
        type: string;
        credential: string;
        message: string;
    }>;
    generatePinForUser(req: any, id: string): Promise<{
        success: boolean;
        pinCode: string;
        message: string;
    }>;
    selfChangeCredentials(req: any, body: {
        currentPin?: string;
        newPin?: string;
        currentPassword?: string;
        newPassword?: string;
    }): Promise<{
        success: boolean;
        message: string;
        user: {
            id: string;
            name: string;
            employeeCode: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            avatarUrl: string;
        };
    }>;
}
