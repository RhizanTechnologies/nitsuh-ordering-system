import { PrismaService } from '../prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getExecutiveDashboard(timeframe?: 'day' | 'week' | 'month' | 'year'): Promise<{
        kpis: {
            totalRevenue: number;
            totalOrdersToday: number;
            averageOrderValue: number;
            cogs: number;
            wastageCost: number;
            expenses: number;
            grossProfit: number;
            grossMarginPercent: number;
            netProfit: number;
            netMarginPercent: number;
            pendingOrders: number;
            ordersInProgress: number;
            readyOrders: number;
            availableTables: string;
            customerSatisfactionScore: number;
        };
        qualityMetrics: {
            satisfactionScore: number;
            completedOrdersCount: number;
            cancelledOrdersCount: number;
            recentCancellations: {
                orderNumber: string;
                reason: string;
                time: Date;
            }[];
        };
        stockValuation: {
            mainStoreValuation: number;
            kitchenStoreValuation: number;
            totalCombined: number;
        };
        topDishes: {
            name: string;
            count: number;
            revenue: number;
            imageUrl: string;
            cogs: number;
        }[];
        weeklyTrend: {
            day: string;
            label: string;
            revenue: number;
            profit: number;
            cogs: number;
            coffee: number;
            food: number;
            tea: number;
            total: number;
            orders: number;
        }[];
        chartMeta: {
            peakBadge: string;
            peakAmount: number;
            peakPeriod: string;
        };
        recentTransactions: {
            id: string;
            orderNumber: string;
            customerName: string;
            tableNumber: string;
            waiterName: string;
            waiterAvatar: string;
            itemsSummary: string;
            totalAmount: number;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
            createdAt: Date;
        }[];
        settings: {
            id: string;
            updatedAt: Date;
            email: string;
            cafeName: string;
            currencySymbol: string;
            taxRate: import("@prisma/client/runtime/library").Decimal;
            serviceChargeRate: import("@prisma/client/runtime/library").Decimal;
            address: string;
            phone: string;
            receiptFooterMessage: string;
        };
    }>;
}
