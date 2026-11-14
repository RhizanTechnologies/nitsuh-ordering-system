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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllUsers() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                employeeCode: true,
                email: true,
                role: true,
                pinCode: true,
                isActive: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        ordersCreated: true,
                        ordersWaitered: true,
                        shifts: true,
                    },
                },
            },
            orderBy: [{ role: 'asc' }, { name: 'asc' }],
        });
    }
    async getUserById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                employeeCode: true,
                email: true,
                role: true,
                pinCode: true,
                isActive: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async createUser(dto, creatorId) {
        const trimmedName = dto.name?.trim();
        if (!trimmedName) {
            throw new common_1.BadRequestException('Employee name is required');
        }
        const trimmedPin = dto.pinCode?.trim();
        if (!trimmedPin || !/^\d{4,6}$/.test(trimmedPin)) {
            throw new common_1.BadRequestException('PIN code must be 4 to 6 digits');
        }
        const existingPinUser = await this.prisma.user.findFirst({
            where: { pinCode: trimmedPin, isActive: true },
        });
        if (existingPinUser) {
            throw new common_1.BadRequestException(`PIN code is already assigned to "${existingPinUser.name}". Each active staff must have a unique PIN.`);
        }
        let code = dto.employeeCode?.trim()?.toUpperCase();
        if (!code) {
            code = await this.generateNextEmployeeCode();
        }
        else {
            const existingCode = await this.prisma.user.findUnique({
                where: { employeeCode: code },
            });
            if (existingCode) {
                throw new common_1.BadRequestException(`Employee Code "${code}" is already taken`);
            }
        }
        const internalEmail = `${code.toLowerCase().replace(/[^a-z0-9]/g, '')}@nitsuh.local`;
        const rawPass = dto.password?.trim() || 'nitsuh123';
        const passwordHash = await bcrypt.hash(rawPass, 10);
        const user = await this.prisma.user.create({
            data: {
                name: trimmedName,
                employeeCode: code,
                email: internalEmail,
                pinCode: trimmedPin,
                passwordHash,
                role: dto.role || client_1.UserRole.CASHIER,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
                avatarUrl: dto.avatarUrl || null,
            },
            select: {
                id: true,
                name: true,
                employeeCode: true,
                email: true,
                role: true,
                pinCode: true,
                isActive: true,
                avatarUrl: true,
                createdAt: true,
            },
        });
        if (creatorId) {
            await this.prisma.auditLog
                .create({
                data: {
                    userId: creatorId,
                    action: 'CREATE_USER',
                    entityName: 'User',
                    entityId: user.id,
                    newValue: { name: user.name, role: user.role, code: user.employeeCode },
                    reason: `Registered new employee ${user.name} (${user.role})`,
                },
            })
                .catch(() => { });
        }
        return user;
    }
    async updateUser(id, dto, updaterId) {
        const existing = await this.getUserById(id);
        const updateData = {};
        if (dto.name !== undefined) {
            const trimmed = dto.name.trim();
            if (!trimmed)
                throw new common_1.BadRequestException('Name cannot be empty');
            updateData.name = trimmed;
        }
        if (dto.role !== undefined) {
            updateData.role = dto.role;
        }
        if (dto.avatarUrl !== undefined) {
            updateData.avatarUrl = dto.avatarUrl;
        }
        if (dto.isActive !== undefined) {
            updateData.isActive = dto.isActive;
        }
        if (dto.employeeCode !== undefined) {
            const code = dto.employeeCode.trim().toUpperCase();
            if (code !== existing.employeeCode) {
                const conflict = await this.prisma.user.findUnique({
                    where: { employeeCode: code },
                });
                if (conflict && conflict.id !== id) {
                    throw new common_1.BadRequestException(`Employee Code "${code}" is already taken`);
                }
                updateData.employeeCode = code;
            }
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                employeeCode: true,
                email: true,
                role: true,
                pinCode: true,
                isActive: true,
                avatarUrl: true,
                updatedAt: true,
            },
        });
        return updated;
    }
    async resetPin(id, newPin, modifierId) {
        const trimmedPin = newPin?.trim();
        if (!trimmedPin || !/^\d{4,6}$/.test(trimmedPin)) {
            throw new common_1.BadRequestException('PIN code must be between 4 and 6 digits');
        }
        const conflict = await this.prisma.user.findFirst({
            where: { pinCode: trimmedPin, isActive: true, NOT: { id } },
        });
        if (conflict) {
            throw new common_1.BadRequestException(`PIN is already assigned to "${conflict.name}". Choose a distinct PIN code.`);
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: { pinCode: trimmedPin },
            select: {
                id: true,
                name: true,
                employeeCode: true,
                role: true,
                pinCode: true,
                updatedAt: true,
            },
        });
        if (modifierId) {
            await this.prisma.auditLog
                .create({
                data: {
                    userId: modifierId,
                    action: 'RESET_USER_PIN',
                    entityName: 'User',
                    entityId: id,
                    reason: `PIN reset for ${updated.name}`,
                },
            })
                .catch(() => { });
        }
        return updated;
    }
    async resetPassword(id, newPass, modifierId) {
        const trimmed = newPass?.trim();
        if (!trimmed || trimmed.length < 6) {
            throw new common_1.BadRequestException('Password must be at least 6 characters');
        }
        const passwordHash = await bcrypt.hash(trimmed, 10);
        const updated = await this.prisma.user.update({
            where: { id },
            data: { passwordHash },
            select: { id: true, name: true, employeeCode: true, role: true },
        });
        return { message: `Password successfully updated for ${updated.name}` };
    }
    async toggleStatus(id, requesterId) {
        if (id === requesterId) {
            throw new common_1.BadRequestException('You cannot deactivate your own account while logged in');
        }
        const user = await this.getUserById(id);
        const newStatus = !user.isActive;
        const updated = await this.prisma.user.update({
            where: { id },
            data: { isActive: newStatus },
            select: {
                id: true,
                name: true,
                employeeCode: true,
                role: true,
                isActive: true,
            },
        });
        return updated;
    }
    async managerOverrideResetPin(managerCred, targetUserId, newPin) {
        const trimmedPin = newPin?.trim();
        if (!trimmedPin || !/^\d{4,6}$/.test(trimmedPin)) {
            throw new common_1.BadRequestException('New PIN must be 4 to 6 numeric digits');
        }
        const manager = await this.prisma.user.findFirst({
            where: {
                role: { in: [client_1.UserRole.OWNER, client_1.UserRole.MANAGER] },
                isActive: true,
                OR: [{ pinCode: managerCred.trim() }],
            },
        });
        let authorizedManager = manager;
        if (!authorizedManager) {
            const managers = await this.prisma.user.findMany({
                where: {
                    role: { in: [client_1.UserRole.OWNER, client_1.UserRole.MANAGER] },
                    isActive: true,
                },
            });
            for (const m of managers) {
                const matches = await bcrypt.compare(managerCred, m.passwordHash);
                if (matches) {
                    authorizedManager = m;
                    break;
                }
            }
        }
        if (!authorizedManager) {
            throw new common_1.UnauthorizedException('Manager authorization failed. Incorrect PIN or Password.');
        }
        const conflict = await this.prisma.user.findFirst({
            where: { pinCode: trimmedPin, isActive: true, NOT: { id: targetUserId } },
        });
        if (conflict) {
            throw new common_1.BadRequestException(`The chosen PIN is already used by "${conflict.name}". Please choose another PIN.`);
        }
        const updatedTarget = await this.prisma.user.update({
            where: { id: targetUserId },
            data: { pinCode: trimmedPin },
            select: {
                id: true,
                name: true,
                employeeCode: true,
                role: true,
                pinCode: true,
            },
        });
        await this.prisma.auditLog
            .create({
            data: {
                userId: authorizedManager.id,
                action: 'TERMINAL_OVERRIDE_PIN_RESET',
                entityName: 'User',
                entityId: targetUserId,
                reason: `Shift Manager ${authorizedManager.name} authorized terminal PIN reset for ${updatedTarget.name}`,
            },
        })
            .catch(() => { });
        return {
            success: true,
            message: `PIN for ${updatedTarget.name} has been successfully reset!`,
            user: updatedTarget,
            authorizedBy: authorizedManager.name,
        };
    }
    async generateNextEmployeeCode() {
        const users = await this.prisma.user.findMany({
            where: { employeeCode: { startsWith: 'EMP-' } },
            select: { employeeCode: true },
        });
        let maxNum = 0;
        for (const u of users) {
            if (u.employeeCode) {
                const match = u.employeeCode.match(/EMP-(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxNum) {
                        maxNum = num;
                    }
                }
            }
        }
        const nextNum = maxNum + 1;
        return `EMP-${String(nextNum).padStart(3, '0')}`;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map