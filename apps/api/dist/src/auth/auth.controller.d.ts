import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: {
        email?: string;
        identifier?: string;
        password: string;
    }): Promise<{
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
    loginWithPin(body: {
        pin: string;
        userId?: string;
    }): Promise<{
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
    getMe(req: any): Promise<any>;
    getStaff(): Promise<{
        id: string;
        name: string;
        employeeCode: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        avatarUrl: string;
    }[]>;
}
