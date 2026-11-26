"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async loginWithPassword(identifier, pass) {
        const trimmed = identifier?.trim();
        if (!trimmed) {
            throw new common_1.UnauthorizedException('Please enter your Employee Code, Name, or Email');
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
            throw new common_1.UnauthorizedException('Invalid identifier or password');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('This account has been disabled by the Owner. Please contact management.');
        }
        const matches = await bcrypt.compare(pass, user.passwordHash);
        if (!matches) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const effectiveRole = user.customRole || user.role;
        const payload = {
            sub: user.id,
            email: user.email,
            role: effectiveRole,
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
                role: effectiveRole,
                avatarUrl: user.avatarUrl,
            },
        };
    }
    async loginWithPin(pin, userId) {
        if (userId) {
            const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });
            if (targetUser && !targetUser.isActive) {
                throw new common_1.UnauthorizedException('This staff account is currently disabled. Please contact the Owner.');
            }
        }
        const whereClause = { pinCode: pin, isActive: true };
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
                throw new common_1.UnauthorizedException('This account has been disabled by the Owner. Please contact management.');
            }
            throw new common_1.UnauthorizedException(userId ? 'Incorrect PIN for the selected employee' : 'Invalid employee PIN');
        }
        if (user.role === 'OWNER' || user.role === 'MANAGER') {
            throw new common_1.UnauthorizedException('Managers and Owners must sign in using code/email and password.');
        }
        const effectiveRole = user.customRole || user.role;
        const payload = {
            sub: user.id,
            email: user.email,
            role: effectiveRole,
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
                role: effectiveRole,
                avatarUrl: user.avatarUrl,
            },
        };
    }
    async getStaffList() {
        const users = await this.prisma.user.findMany({
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
                customRole: true,
                avatarUrl: true,
            },
            orderBy: { name: 'asc' },
        });
        return users.map((u) => ({
            ...u,
            role: u.customRole || u.role,
        }));
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map