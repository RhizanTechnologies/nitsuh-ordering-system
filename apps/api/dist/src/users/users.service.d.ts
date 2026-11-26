import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { UserRole, Prisma } from '@prisma/client';
export interface CreateUserDto {
    name: string;
    employeeCode?: string;
    role: UserRole | string;
    pinCode: string;
    password?: string;
    avatarUrl?: string;
    isActive?: boolean;
}
export interface UpdateUserDto {
    name?: string;
    employeeCode?: string;
    role?: UserRole | string;
    avatarUrl?: string;
    isActive?: boolean;
}
export declare class UsersService {
    private prisma;
    private eventsGateway;
    private readonly logger;
    constructor(prisma: PrismaService, eventsGateway: EventsGateway);
    getAllUsers(requesterRole?: string): Promise<{
        role: any;
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
        customRole: string;
        isActive: boolean;
        avatarUrl: string;
    }[]>;
    getUserById(id: string, requesterRole?: string): Promise<{
        role: any;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        employeeCode: string;
        email: string;
        pinCode: string;
        customRole: string;
        isActive: boolean;
        avatarUrl: string;
    }>;
    createUser(dto: CreateUserDto, creatorId?: string): Promise<{
        role: any;
        id: string;
        createdAt: Date;
        name: string;
        employeeCode: string;
        email: string;
        pinCode: string;
        customRole: string;
        isActive: boolean;
        avatarUrl: string;
    }>;
    updateUser(id: string, dto: UpdateUserDto, updaterId?: string, updaterRole?: string): Promise<{
        role: any;
        id: string;
        updatedAt: Date;
        name: string;
        employeeCode: string;
        email: string;
        pinCode: string;
        customRole: string;
        isActive: boolean;
        avatarUrl: string;
    }>;
    resetPin(id: string, newPin: string, modifierId?: string, modifierRole?: string): Promise<{
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
    toggleStatus(id: string, requesterId: string, requesterRole?: string): Promise<{
        id: string;
        name: string;
        employeeCode: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    deleteUser(id: string, requesterId: string, requesterRole?: string): Promise<{
        message: string;
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
    createResetRequest(dto: {
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
    getResetRequests(requesterRole?: string): Promise<{
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
    resolveResetRequest(requestId: string, action: 'GENERATE_PIN' | 'GENERATE_PASSWORD' | 'DISMISS', resolver: {
        id: string;
        name: string;
        role?: string;
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
    generateRandomPinForUser(userId: string, resolver: {
        id: string;
        name: string;
        role?: string;
    }): Promise<{
        success: boolean;
        pinCode: string;
        message: string;
    }>;
    selfChangeCredentials(userId: string, dto: {
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
    getRolePermissions(): Promise<string | number | true | Prisma.JsonObject | Prisma.JsonArray>;
    updateRolePermissions(permissions: any, actorUserId: string): Promise<{
        success: boolean;
        message: string;
        permissions: any;
    }>;
    private generateNextEmployeeCode;
}
