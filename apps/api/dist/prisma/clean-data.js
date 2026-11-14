"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function cleanData() {
    console.log('🧹 Purging operational, transactional, and mock test data...');
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`Deleted ${deletedPayments.count} payments`);
    const deletedOrderItems = await prisma.orderItem.deleteMany({});
    console.log(`Deleted ${deletedOrderItems.count} order items`);
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`Deleted ${deletedOrders.count} orders`);
    const deletedTransferItems = await prisma.stockTransferItem.deleteMany({});
    console.log(`Deleted ${deletedTransferItems.count} stock transfer items`);
    const deletedTransfers = await prisma.stockTransfer.deleteMany({});
    console.log(`Deleted ${deletedTransfers.count} stock transfers`);
    const deletedPoItems = await prisma.purchaseOrderItem.deleteMany({});
    console.log(`Deleted ${deletedPoItems.count} purchase order items`);
    const deletedPos = await prisma.purchaseOrder.deleteMany({});
    console.log(`Deleted ${deletedPos.count} purchase orders`);
    const deletedTransactions = await prisma.inventoryTransaction.deleteMany({});
    console.log(`Deleted ${deletedTransactions.count} inventory transactions`);
    const deletedExpenses = await prisma.expense.deleteMany({});
    console.log(`Deleted ${deletedExpenses.count} expenses`);
    const deletedShifts = await prisma.cashierShift.deleteMany({});
    console.log(`Deleted ${deletedShifts.count} cashier shifts`);
    const deletedAuditLogs = await prisma.auditLog.deleteMany({});
    console.log(`Deleted ${deletedAuditLogs.count} audit logs`);
    const updatedTables = await prisma.diningTable.updateMany({
        data: {
            status: client_1.TableStatus.AVAILABLE
        }
    });
    console.log(`Reset ${updatedTables.count} dining tables to AVAILABLE`);
    const updatedBalances = await prisma.inventoryBalance.updateMany({
        data: {
            reservedQuantity: 0
        }
    });
    console.log(`Reset reserved quantities across ${updatedBalances.count} inventory balances`);
    console.log('✨ Clean slate ready: All products, categories, recipes, ingredients, locations, and auth users preserved!');
}
cleanData()
    .catch((e) => {
    console.error('❌ Error during data purge:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=clean-data.js.map