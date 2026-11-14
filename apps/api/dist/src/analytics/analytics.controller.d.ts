import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(timeframe?: 'day' | 'week' | 'month' | 'year', role?: string): Promise<{
        kpis: {
            totalRevenue: number;
            totalOrdersToday: number;
            averageOrderValue: number;
            cogs: number;
            wastageCost: number;
            expenses: number;
            grossProfit: number;
            netProfit: number;
            netMarginPercent: number;
            pendingOrders: number;
            ordersInProgress: number;
            readyOrders: number;
            availableTables: string;
            customerSatisfactionScore: number;
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
        }[];
        weeklyTrend: {
            day: string;
            coffee: number;
            food: number;
            tea: number;
            total: number;
        }[];
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
