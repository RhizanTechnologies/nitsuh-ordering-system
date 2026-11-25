"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const shared_types_1 = require("@cafe/shared-types");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getExecutiveDashboard(timeframe = 'day') {
        const now = new Date();
        const startDate = new Date(now);
        if (timeframe === 'day') {
            startDate.setHours(0, 0, 0, 0);
        }
        else if (timeframe === 'week') {
            startDate.setDate(now.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
        }
        else if (timeframe === 'month') {
            startDate.setDate(now.getDate() - 29);
            startDate.setHours(0, 0, 0, 0);
        }
        else if (timeframe === 'year') {
            startDate.setFullYear(now.getFullYear() - 1);
            startDate.setHours(0, 0, 0, 0);
        }
        const completedOrders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                OR: [
                    { paymentStatus: shared_types_1.PaymentStatus.PAID },
                    { status: shared_types_1.OrderStatus.COMPLETED },
                ],
            },
            include: {
                items: {
                    include: {
                        menuItem: {
                            include: {
                                category: true,
                                directIngredient: true,
                                recipe: {
                                    include: {
                                        ingredients: {
                                            include: { ingredient: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                payments: true,
                waiter: { select: { id: true, name: true, avatarUrl: true } },
                cashier: { select: { id: true, name: true } },
                table: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        let totalCogs = 0;
        for (const order of completedOrders) {
            for (const item of order.items) {
                let itemPortionCost = Number(item.costAtSale || 0);
                if (itemPortionCost <= 0 && item.menuItem) {
                    if (item.menuItem.recipe && item.menuItem.recipe.ingredients?.length) {
                        const recipeSum = item.menuItem.recipe.ingredients.reduce((acc, ri) => {
                            const unitCost = Number(ri.ingredient?.currentCostPerBaseUnit || 0);
                            const qty = Number(ri.quantity || 0);
                            return acc + unitCost * qty;
                        }, 0);
                        const yieldPortions = Number(item.menuItem.recipe.yieldPortions || 1);
                        itemPortionCost = yieldPortions > 0 ? recipeSum / yieldPortions : recipeSum;
                    }
                    else if (item.menuItem.directIngredient) {
                        itemPortionCost = Number(item.menuItem.directIngredient.currentCostPerBaseUnit || 0);
                    }
                }
                totalCogs += itemPortionCost * (item.quantity || 1);
            }
        }
        const wastage = await this.prisma.inventoryTransaction.findMany({
            where: {
                transactionType: 'WASTAGE',
                createdAt: { gte: startDate },
            },
        });
        const totalWastageCost = wastage.reduce((sum, w) => sum + Math.abs(Number(w.totalCost || 0)), 0);
        const expenses = await this.prisma.expense.findMany({
            where: { date: { gte: startDate } },
        });
        let totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        if (timeframe === 'day' && totalExpenses > 0) {
            totalExpenses = totalExpenses / 30;
        }
        const grossProfit = totalRevenue - totalCogs;
        const netProfit = grossProfit - totalWastageCost - totalExpenses;
        const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const pendingOrdersCount = await this.prisma.order.count({
            where: { status: { in: [shared_types_1.OrderStatus.DRAFT_NOTE, shared_types_1.OrderStatus.CONFIRMED] } },
        });
        const inProgressCount = await this.prisma.order.count({
            where: { status: shared_types_1.OrderStatus.IN_PREPARATION },
        });
        const readyOrdersCount = await this.prisma.order.count({
            where: { status: shared_types_1.OrderStatus.READY },
        });
        const totalTables = await this.prisma.diningTable.count();
        const activeTables = await this.prisma.diningTable.count({
            where: {
                OR: [
                    { status: 'OCCUPIED' },
                    {
                        orders: {
                            some: {
                                status: { in: [shared_types_1.OrderStatus.CONFIRMED, shared_types_1.OrderStatus.IN_PREPARATION, shared_types_1.OrderStatus.READY, shared_types_1.OrderStatus.SERVED] },
                            },
                        },
                    },
                ],
            },
        });
        const cancelledOrders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                status: shared_types_1.OrderStatus.CANCELLED,
            },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                orderNumber: true,
                cancellationReason: true,
                notes: true,
                updatedAt: true,
            },
        });
        const totalTrackedOrders = completedOrders.length + cancelledOrders.length;
        const customerSatisfactionScore = totalTrackedOrders > 0
            ? Math.round((completedOrders.length / totalTrackedOrders) * 100)
            : 100;
        const itemSalesMap = new Map();
        for (const order of completedOrders) {
            for (const itm of order.items) {
                const id = itm.menuItemId;
                const existing = itemSalesMap.get(id) || {
                    name: itm.menuItem?.name || 'Item',
                    count: 0,
                    revenue: 0,
                    imageUrl: itm.menuItem?.imageUrl || '',
                    cogs: 0,
                };
                existing.count += itm.quantity;
                existing.revenue += Number(itm.subtotal || 0);
                existing.cogs += Number(itm.costAtSale || 0) * itm.quantity;
                itemSalesMap.set(id, existing);
            }
        }
        const topDishes = Array.from(itemSalesMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        const balances = await this.prisma.inventoryBalance.findMany({
            include: {
                location: true,
                ingredient: true,
            },
        });
        let mainStoreValuation = 0;
        let kitchenStoreValuation = 0;
        for (const b of balances) {
            const val = Number(b.quantity || 0) * Number(b.ingredient?.currentCostPerBaseUnit || 0);
            if (b.location?.type === 'MAIN_STORE') {
                mainStoreValuation += val;
            }
            else {
                kitchenStoreValuation += val;
            }
        }
        const settings = (await this.prisma.businessSettings.findUnique({ where: { id: 'default' } })) ||
            (await this.prisma.businessSettings.findFirst());
        const recentTransactions = completedOrders.slice(0, 8).map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerName: o.customerName || 'Walk-in Guest',
            tableNumber: o.table?.tableNumber || (o.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Dine-In'),
            waiterName: o.waiter?.name || (o.cashier?.name ? `${o.cashier.name} (Cashier)` : 'Staff'),
            waiterAvatar: o.waiter?.avatarUrl,
            itemsSummary: o.items.map((i) => `${i.quantity}x ${i.menuItem?.name || 'Item'}`).join(', ') || 'No items',
            totalAmount: Number(o.totalAmount || 0),
            paymentMethod: o.payments[0]?.paymentMethod || 'CASH',
            createdAt: o.createdAt,
        }));
        const weeklyTrend = [];
        if (timeframe === 'day') {
            const hours = [8, 10, 12, 14, 16, 18, 20, 22];
            for (const h of hours) {
                const slotLabel = `${h < 10 ? '0' + h : h}:00`;
                weeklyTrend.push({
                    day: slotLabel,
                    label: slotLabel,
                    revenue: 0,
                    profit: 0,
                    cogs: 0,
                    coffee: 0,
                    food: 0,
                    tea: 0,
                    total: 0,
                    orders: 0,
                });
            }
            for (const o of completedOrders) {
                const oHour = new Date(o.createdAt).getHours();
                let bucketIdx = weeklyTrend.findIndex((b) => {
                    const bHour = parseInt(b.label.split(':')[0], 10);
                    return Math.abs(bHour - oHour) < 2;
                });
                if (bucketIdx === -1)
                    bucketIdx = weeklyTrend.length - 1;
                const rev = Number(o.totalAmount || 0);
                let cogsForOrder = 0;
                for (const item of o.items) {
                    const cost = Number(item.costAtSale || 0) * item.quantity;
                    cogsForOrder += cost;
                    const catName = item.menuItem?.category?.name?.toLowerCase() || '';
                    if (catName.includes('coffee')) {
                        weeklyTrend[bucketIdx].coffee += Number(item.subtotal || 0);
                    }
                    else if (catName.includes('tea')) {
                        weeklyTrend[bucketIdx].tea += Number(item.subtotal || 0);
                    }
                    else {
                        weeklyTrend[bucketIdx].food += Number(item.subtotal || 0);
                    }
                }
                weeklyTrend[bucketIdx].revenue += rev;
                weeklyTrend[bucketIdx].cogs += cogsForOrder;
                weeklyTrend[bucketIdx].profit += rev - cogsForOrder;
                weeklyTrend[bucketIdx].total += rev;
                weeklyTrend[bucketIdx].orders += 1;
            }
        }
        else if (timeframe === 'week') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                const dayName = days[d.getDay()];
                const label = `${dayName} ${d.getDate()}`;
                weeklyTrend.push({
                    day: dayName,
                    label: label,
                    revenue: 0,
                    profit: 0,
                    cogs: 0,
                    coffee: 0,
                    food: 0,
                    tea: 0,
                    total: 0,
                    orders: 0,
                });
            }
            for (const o of completedOrders) {
                const oDate = new Date(o.createdAt);
                const diffDays = Math.floor((now.getTime() - oDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays < 7) {
                    const bucketIdx = 6 - diffDays;
                    if (weeklyTrend[bucketIdx]) {
                        const rev = Number(o.totalAmount || 0);
                        let cogsForOrder = 0;
                        for (const item of o.items) {
                            const cost = Number(item.costAtSale || 0) * item.quantity;
                            cogsForOrder += cost;
                            const catName = item.menuItem?.category?.name?.toLowerCase() || '';
                            if (catName.includes('coffee')) {
                                weeklyTrend[bucketIdx].coffee += Number(item.subtotal || 0);
                            }
                            else if (catName.includes('tea')) {
                                weeklyTrend[bucketIdx].tea += Number(item.subtotal || 0);
                            }
                            else {
                                weeklyTrend[bucketIdx].food += Number(item.subtotal || 0);
                            }
                        }
                        weeklyTrend[bucketIdx].revenue += rev;
                        weeklyTrend[bucketIdx].cogs += cogsForOrder;
                        weeklyTrend[bucketIdx].profit += rev - cogsForOrder;
                        weeklyTrend[bucketIdx].total += rev;
                        weeklyTrend[bucketIdx].orders += 1;
                    }
                }
            }
        }
        else if (timeframe === 'month') {
            for (let w = 1; w <= 4; w++) {
                weeklyTrend.push({
                    day: `Wk ${w}`,
                    label: `Week ${w}`,
                    revenue: 0,
                    profit: 0,
                    cogs: 0,
                    coffee: 0,
                    food: 0,
                    tea: 0,
                    total: 0,
                    orders: 0,
                });
            }
            for (const o of completedOrders) {
                const oDate = new Date(o.createdAt);
                const diffDays = Math.floor((now.getTime() - oDate.getTime()) / (1000 * 60 * 60 * 24));
                const weekIdx = Math.min(3, Math.max(0, 3 - Math.floor(diffDays / 7)));
                const rev = Number(o.totalAmount || 0);
                let cogsForOrder = 0;
                for (const item of o.items) {
                    const cost = Number(item.costAtSale || 0) * item.quantity;
                    cogsForOrder += cost;
                    const catName = item.menuItem?.category?.name?.toLowerCase() || '';
                    if (catName.includes('coffee')) {
                        weeklyTrend[weekIdx].coffee += Number(item.subtotal || 0);
                    }
                    else if (catName.includes('tea')) {
                        weeklyTrend[weekIdx].tea += Number(item.subtotal || 0);
                    }
                    else {
                        weeklyTrend[weekIdx].food += Number(item.subtotal || 0);
                    }
                }
                weeklyTrend[weekIdx].revenue += rev;
                weeklyTrend[weekIdx].cogs += cogsForOrder;
                weeklyTrend[weekIdx].profit += rev - cogsForOrder;
                weeklyTrend[weekIdx].total += rev;
                weeklyTrend[weekIdx].orders += 1;
            }
        }
        else {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let m = 0; m < 12; m++) {
                weeklyTrend.push({
                    day: monthNames[m],
                    label: monthNames[m],
                    revenue: 0,
                    profit: 0,
                    cogs: 0,
                    coffee: 0,
                    food: 0,
                    tea: 0,
                    total: 0,
                    orders: 0,
                });
            }
            for (const o of completedOrders) {
                const m = new Date(o.createdAt).getMonth();
                const rev = Number(o.totalAmount || 0);
                let cogsForOrder = 0;
                for (const item of o.items) {
                    const cost = Number(item.costAtSale || 0) * item.quantity;
                    cogsForOrder += cost;
                    const catName = item.menuItem?.category?.name?.toLowerCase() || '';
                    if (catName.includes('coffee')) {
                        weeklyTrend[m].coffee += Number(item.subtotal || 0);
                    }
                    else if (catName.includes('tea')) {
                        weeklyTrend[m].tea += Number(item.subtotal || 0);
                    }
                    else {
                        weeklyTrend[m].food += Number(item.subtotal || 0);
                    }
                }
                weeklyTrend[m].revenue += rev;
                weeklyTrend[m].cogs += cogsForOrder;
                weeklyTrend[m].profit += rev - cogsForOrder;
                weeklyTrend[m].total += rev;
                weeklyTrend[m].orders += 1;
            }
        }
        let peakEntry = weeklyTrend[0];
        for (const b of weeklyTrend) {
            if ((b.revenue || b.total) > (peakEntry.revenue || peakEntry.total)) {
                peakEntry = b;
            }
        }
        const peakAmount = Math.max(0, peakEntry?.revenue || peakEntry?.total || 0);
        const peakBadge = peakAmount > 0
            ? `Peak: ${peakEntry.label || peakEntry.day} (${peakAmount.toFixed(2)} ETB)`
            : 'No peak sales recorded';
        return {
            kpis: {
                totalRevenue: Number(totalRevenue.toFixed(2)),
                totalOrdersToday: completedOrders.length,
                averageOrderValue: completedOrders.length > 0
                    ? Number((totalRevenue / completedOrders.length).toFixed(2))
                    : 0,
                cogs: Number(totalCogs.toFixed(2)),
                wastageCost: Number(totalWastageCost.toFixed(2)),
                expenses: Number(totalExpenses.toFixed(2)),
                grossProfit: Number(grossProfit.toFixed(2)),
                grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
                netProfit: Number(netProfit.toFixed(2)),
                netMarginPercent: Number(netMarginPercent.toFixed(1)),
                pendingOrders: pendingOrdersCount,
                ordersInProgress: inProgressCount,
                readyOrders: readyOrdersCount,
                availableTables: `${Math.max(0, totalTables - activeTables)}/${totalTables}`,
                customerSatisfactionScore,
            },
            qualityMetrics: {
                satisfactionScore: customerSatisfactionScore,
                completedOrdersCount: completedOrders.length,
                cancelledOrdersCount: cancelledOrders.length,
                recentCancellations: cancelledOrders.map((c) => ({
                    orderNumber: c.orderNumber,
                    reason: c.cancellationReason || c.notes || 'Order cancelled before prep',
                    time: c.updatedAt,
                })),
            },
            stockValuation: {
                mainStoreValuation: Number(mainStoreValuation.toFixed(2)),
                kitchenStoreValuation: Number(kitchenStoreValuation.toFixed(2)),
                totalCombined: Number((mainStoreValuation + kitchenStoreValuation).toFixed(2)),
            },
            topDishes,
            weeklyTrend,
            chartMeta: {
                peakBadge,
                peakAmount,
                peakPeriod: peakEntry?.label || peakEntry?.day || '',
            },
            recentTransactions,
            settings,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map