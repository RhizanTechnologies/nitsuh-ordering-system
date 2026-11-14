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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting comprehensive seed with Nitsuh Foods & Cafe data...');
    const defaultPassword = await bcrypt.hash('password123', 10);
    const usersData = [
        {
            name: 'Samantha W',
            email: 'samantha@greengrounds.com',
            pinCode: '1234',
            passwordHash: defaultPassword,
            role: client_1.UserRole.CASHIER,
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
        },
        {
            name: 'Adam S (Owner)',
            email: 'adam@greengrounds.com',
            pinCode: '0000',
            passwordHash: defaultPassword,
            role: client_1.UserRole.OWNER,
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        },
        {
            name: 'John Holland (Manager)',
            email: 'john@greengrounds.com',
            pinCode: '1111',
            passwordHash: defaultPassword,
            role: client_1.UserRole.MANAGER,
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
        },
        {
            name: 'Abel Tesfaye (Waiter)',
            email: 'abel.waiter@greengrounds.com',
            pinCode: '2222',
            passwordHash: defaultPassword,
            role: client_1.UserRole.WAITER,
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
        },
        {
            name: 'Sara K (Waiter)',
            email: 'sara.waiter@greengrounds.com',
            pinCode: '3333',
            passwordHash: defaultPassword,
            role: client_1.UserRole.WAITER,
            avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
        },
        {
            name: 'Chef Dawit (Kitchen)',
            email: 'chef.dawit@greengrounds.com',
            pinCode: '4444',
            passwordHash: defaultPassword,
            role: client_1.UserRole.KITCHEN_STAFF,
            avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150'
        },
        {
            name: 'Michael (Main Store)',
            email: 'michael.main@greengrounds.com',
            pinCode: '5555',
            passwordHash: defaultPassword,
            role: client_1.UserRole.MAIN_STOREKEEPER,
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
        },
        {
            name: 'Daniel (Kitchen Store)',
            email: 'daniel.kitchen@greengrounds.com',
            pinCode: '6666',
            passwordHash: defaultPassword,
            role: client_1.UserRole.KITCHEN_STOREKEEPER,
            avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
        }
    ];
    const users = {};
    for (const u of usersData) {
        users[u.email] = await prisma.user.upsert({
            where: { email: u.email },
            update: { pinCode: u.pinCode, role: u.role, name: u.name, avatarUrl: u.avatarUrl },
            create: u
        });
    }
    const gramUnit = await prisma.unit.upsert({
        where: { symbol: 'g' },
        update: {},
        create: { name: 'Gram', symbol: 'g', type: 'MASS', baseMultiplier: 1 }
    });
    const kgUnit = await prisma.unit.upsert({
        where: { symbol: 'kg' },
        update: {},
        create: { name: 'Kilogram', symbol: 'kg', type: 'MASS', baseMultiplier: 1000 }
    });
    const mlUnit = await prisma.unit.upsert({
        where: { symbol: 'ml' },
        update: {},
        create: { name: 'Milliliter', symbol: 'ml', type: 'VOLUME', baseMultiplier: 1 }
    });
    const literUnit = await prisma.unit.upsert({
        where: { symbol: 'l' },
        update: {},
        create: { name: 'Liter', symbol: 'l', type: 'VOLUME', baseMultiplier: 1000 }
    });
    const pieceUnit = await prisma.unit.upsert({
        where: { symbol: 'pcs' },
        update: {},
        create: { name: 'Piece', symbol: 'pcs', type: 'COUNT', baseMultiplier: 1 }
    });
    const mainStore = await prisma.inventoryLocation.upsert({
        where: { type: client_1.LocationType.MAIN_STORE },
        update: {},
        create: { name: 'Main Store (Bulk Warehouse)', type: client_1.LocationType.MAIN_STORE }
    });
    const kitchenStore = await prisma.inventoryLocation.upsert({
        where: { type: client_1.LocationType.KITCHEN_STORE },
        update: {},
        create: { name: 'Kitchen Store (Production Floor)', type: client_1.LocationType.KITCHEN_STORE }
    });
    const tables = [
        { tableNumber: 'B12 - Indoor', capacity: 4, status: client_1.TableStatus.AVAILABLE },
        { tableNumber: 'T01 - Window', capacity: 2, status: client_1.TableStatus.AVAILABLE },
        { tableNumber: 'T02 - Lounge', capacity: 6, status: client_1.TableStatus.AVAILABLE },
        { tableNumber: 'T03 - Patio', capacity: 4, status: client_1.TableStatus.AVAILABLE },
        { tableNumber: 'T04 - Terrace', capacity: 4, status: client_1.TableStatus.AVAILABLE },
        { tableNumber: 'T05 - Indoor', capacity: 2, status: client_1.TableStatus.AVAILABLE },
        { tableNumber: 'T06 - VIP Lounge', capacity: 8, status: client_1.TableStatus.AVAILABLE }
    ];
    for (const t of tables) {
        await prisma.diningTable.upsert({
            where: { tableNumber: t.tableNumber },
            update: {},
            create: t
        });
    }
    const rawIngredientsData = [
        { sku: 'ING-COFFEE-01', name: 'Arabica Coffee Beans (Yirgacheffe Grade 1)', category: 'Coffee', unit: gramUnit, costPerBaseUnit: 1.20, mainStock: 30000, kitchenStock: 5000 },
        { sku: 'ING-MILK-01', name: 'Fresh Whole Milk (Highland)', category: 'Dairy', unit: mlUnit, costPerBaseUnit: 0.09, mainStock: 50000, kitchenStock: 12000 },
        { sku: 'ING-PASTA-01', name: 'Durum Wheat Pasta (Primo)', category: 'Dry Goods', unit: gramUnit, costPerBaseUnit: 0.18, mainStock: 40000, kitchenStock: 8000 },
        { sku: 'ING-TOMATO-01', name: 'Fresh Plum Tomatoes', category: 'Produce', unit: gramUnit, costPerBaseUnit: 0.08, mainStock: 25000, kitchenStock: 6000 },
        { sku: 'ING-BEEF-01', name: 'Fresh Ground Beef (Prime Cut)', category: 'Meat', unit: gramUnit, costPerBaseUnit: 0.85, mainStock: 20000, kitchenStock: 4000 },
        { sku: 'ING-CHICKEN-01', name: 'Fresh Chicken Breast', category: 'Meat', unit: gramUnit, costPerBaseUnit: 0.65, mainStock: 30000, kitchenStock: 6000 },
        { sku: 'ING-CHEESE-01', name: 'Mozzarella Cheese (Artisanal)', category: 'Dairy', unit: gramUnit, costPerBaseUnit: 0.70, mainStock: 15000, kitchenStock: 3500 },
        { sku: 'ING-FLOUR-01', name: 'Finest Pizza Flour (Tipo 00)', category: 'Dry Goods', unit: gramUnit, costPerBaseUnit: 0.12, mainStock: 60000, kitchenStock: 15000 },
        { sku: 'ING-OIL-01', name: 'Pure Vegetable Cooking Oil', category: 'Oils', unit: mlUnit, costPerBaseUnit: 0.22, mainStock: 25000, kitchenStock: 4000 },
        { sku: 'ING-ONION-01', name: 'Red Onions (Hawassa)', category: 'Produce', unit: gramUnit, costPerBaseUnit: 0.07, mainStock: 20000, kitchenStock: 4000 },
        { sku: 'ING-SALT-01', name: 'Iodized Table Salt', category: 'Seasoning', unit: gramUnit, costPerBaseUnit: 0.03, mainStock: 10000, kitchenStock: 2000 },
        { sku: 'ING-TEA-GREEN-01', name: 'Organic Green Tea Leaves', category: 'Tea', unit: gramUnit, costPerBaseUnit: 1.50, mainStock: 5000, kitchenStock: 1000 },
        { sku: 'ING-BUN-01', name: 'Fresh Brioche Burger Buns', category: 'Bakery', unit: pieceUnit, costPerBaseUnit: 25.00, mainStock: 200, kitchenStock: 50 },
        { sku: 'RET-COKE-01', name: 'Coca-Cola 330ml Can', category: 'Beverage Retail', unit: pieceUnit, costPerBaseUnit: 32.00, mainStock: 240, kitchenStock: 48 },
        { sku: 'RET-WATER-01', name: 'Yes Spring Water 500ml', category: 'Beverage Retail', unit: pieceUnit, costPerBaseUnit: 18.00, mainStock: 500, kitchenStock: 96 }
    ];
    const ingredients = {};
    for (const item of rawIngredientsData) {
        const ing = await prisma.ingredient.upsert({
            where: { sku: item.sku },
            update: { currentCostPerBaseUnit: item.costPerBaseUnit },
            create: {
                sku: item.sku,
                name: item.name,
                category: item.category,
                baseUnitId: item.unit.id,
                currentCostPerBaseUnit: item.costPerBaseUnit,
                reorderThresholdMain: item.mainStock * 0.2,
                reorderThresholdKitchen: item.kitchenStock * 0.25
            }
        });
        ingredients[item.sku] = ing;
        await prisma.inventoryBalance.upsert({
            where: {
                locationId_ingredientId: { locationId: mainStore.id, ingredientId: ing.id }
            },
            update: { quantity: item.mainStock },
            create: {
                locationId: mainStore.id,
                ingredientId: ing.id,
                quantity: item.mainStock
            }
        });
        await prisma.inventoryBalance.upsert({
            where: {
                locationId_ingredientId: { locationId: kitchenStore.id, ingredientId: ing.id }
            },
            update: { quantity: item.kitchenStock },
            create: {
                locationId: kitchenStore.id,
                ingredientId: ing.id,
                quantity: item.kitchenStock
            }
        });
    }
    const catCoffee = await prisma.category.upsert({
        where: { name: 'Coffee' },
        update: {},
        create: { name: 'Coffee', displayOrder: 1, iconName: 'Coffee', badgeColor: 'bg-emerald-800' }
    });
    const catTea = await prisma.category.upsert({
        where: { name: 'Tea' },
        update: {},
        create: { name: 'Tea', displayOrder: 2, iconName: 'CupSoda', badgeColor: 'bg-rose-400' }
    });
    const catMains = await prisma.category.upsert({
        where: { name: 'Main Dishes' },
        update: {},
        create: { name: 'Main Dishes', displayOrder: 3, iconName: 'Utensils', badgeColor: 'bg-amber-600' }
    });
    const catSnacks = await prisma.category.upsert({
        where: { name: 'Snack & Fast Food' },
        update: {},
        create: { name: 'Snack & Fast Food', displayOrder: 4, iconName: 'Sandwich', badgeColor: 'bg-orange-500' }
    });
    const catRetail = await prisma.category.upsert({
        where: { name: 'Beverages (Retail)' },
        update: {},
        create: { name: 'Beverages (Retail)', displayOrder: 5, iconName: 'BottleWater', badgeColor: 'bg-blue-600' }
    });
    const menuList = [
        {
            name: 'Americano',
            category: catCoffee,
            price: 60.00,
            description: 'Rich double espresso pulled over hot artisanal water',
            imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
            prepSection: 'BAR_COFFEE',
            isDirectSale: false,
            recipe: [
                { ing: ingredients['ING-COFFEE-01'], qty: 18, unit: gramUnit }
            ]
        },
        {
            name: 'Espresso',
            category: catCoffee,
            price: 50.00,
            description: 'Single origin bold pulled espresso',
            imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400',
            prepSection: 'BAR_COFFEE',
            isDirectSale: false,
            recipe: [
                { ing: ingredients['ING-COFFEE-01'], qty: 18, unit: gramUnit }
            ]
        },
        {
            name: 'Cappuccino',
            category: catCoffee,
            price: 75.00,
            description: 'Equal parts espresso, silky steamed milk, and velvety foam',
            imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
            prepSection: 'BAR_COFFEE',
            isDirectSale: false,
            recipe: [
                { ing: ingredients['ING-COFFEE-01'], qty: 18, unit: gramUnit },
                { ing: ingredients['ING-MILK-01'], qty: 150, unit: mlUnit }
            ]
        },
        {
            name: 'Latte',
            category: catCoffee,
            price: 85.00,
            description: 'Velvety espresso with abundant lightly steamed fresh milk',
            imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400',
            prepSection: 'BAR_COFFEE',
            isDirectSale: false,
            recipe: [
                { ing: ingredients['ING-COFFEE-01'], qty: 18, unit: gramUnit },
                { ing: ingredients['ING-MILK-01'], qty: 220, unit: mlUnit }
            ]
        },
        {
            name: 'Special Pasta (Special Bolognese)',
            category: catMains,
            price: 180.00,
            description: 'Slow-simmered prime minced beef, fresh plum tomatoes, garlic and herbs over durum pasta',
            imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281226?w=400',
            prepSection: 'HOT_KITCHEN',
            isDirectSale: false,
            recipe: [
                { ing: ingredients['ING-PASTA-01'], qty: 150, unit: gramUnit },
                { ing: ingredients['ING-BEEF-01'], qty: 80, unit: gramUnit },
                { ing: ingredients['ING-TOMATO-01'], qty: 80, unit: gramUnit },
                { ing: ingredients['ING-ONION-01'], qty: 30, unit: gramUnit },
                { ing: ingredients['ING-OIL-01'], qty: 15, unit: mlUnit },
                { ing: ingredients['ING-SALT-01'], qty: 5, unit: gramUnit }
            ]
        },
        {
            name: 'Grilled Chicken Burger',
            category: catSnacks,
            price: 240.00,
            description: 'Tender marinated chicken breast, melted mozzarella, on a fresh brioche bun',
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
            prepSection: 'HOT_KITCHEN',
            isDirectSale: false,
            recipe: [
                { ing: ingredients['ING-BUN-01'], qty: 1, unit: pieceUnit },
                { ing: ingredients['ING-CHICKEN-01'], qty: 180, unit: gramUnit },
                { ing: ingredients['ING-CHEESE-01'], qty: 30, unit: gramUnit },
                { ing: ingredients['ING-OIL-01'], qty: 10, unit: mlUnit }
            ]
        },
        {
            name: 'Margherita Pizza',
            category: catMains,
            price: 380.00,
            description: 'Hand-stretched dough, crushed plum tomatoes, melted mozzarella and fragrant basil',
            imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400',
            prepSection: 'HOT_KITCHEN',
            isDirectSale: false,
            recipe: [
                { ing: ingredients['ING-FLOUR-01'], qty: 220, unit: gramUnit },
                { ing: ingredients['ING-TOMATO-01'], qty: 100, unit: gramUnit },
                { ing: ingredients['ING-CHEESE-01'], qty: 120, unit: gramUnit },
                { ing: ingredients['ING-OIL-01'], qty: 15, unit: mlUnit }
            ]
        },
        {
            name: 'Coca-Cola 330ml Can',
            category: catRetail,
            price: 45.00,
            description: 'Chilled canned Coca-Cola',
            imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
            prepSection: 'BAR_COFFEE',
            isDirectSale: true,
            directIngredient: ingredients['RET-COKE-01'],
            recipe: []
        },
        {
            name: 'Yes Spring Water 500ml',
            category: catRetail,
            price: 30.00,
            description: 'Pure natural spring mineral water bottle',
            imageUrl: 'https://images.unsplash.com/photo-1559839914-1b3303100918?w=400',
            prepSection: 'BAR_COFFEE',
            isDirectSale: true,
            directIngredient: ingredients['RET-WATER-01'],
            recipe: []
        }
    ];
    for (const m of menuList) {
        let menuItem = await prisma.menuItem.findFirst({
            where: { name: m.name }
        });
        if (!menuItem) {
            menuItem = await prisma.menuItem.create({
                data: {
                    name: m.name,
                    categoryId: m.category.id,
                    price: m.price,
                    description: m.description,
                    imageUrl: m.imageUrl,
                    prepSection: m.prepSection,
                    isDirectSale: m.isDirectSale,
                    directIngredientId: m.directIngredient?.id || null
                }
            });
        }
        else {
            await prisma.menuItem.update({
                where: { id: menuItem.id },
                data: { price: m.price, isDirectSale: m.isDirectSale, directIngredientId: m.directIngredient?.id || null }
            });
        }
        if (m.recipe && m.recipe.length > 0) {
            let recipe = await prisma.recipe.findUnique({
                where: { menuItemId: menuItem.id }
            });
            if (!recipe) {
                recipe = await prisma.recipe.create({
                    data: {
                        menuItemId: menuItem.id,
                        yieldPortions: 1,
                        prepInstructions: `Standard prep for ${m.name}`
                    }
                });
            }
            else {
                await prisma.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
            }
            for (const r of m.recipe) {
                await prisma.recipeIngredient.create({
                    data: {
                        recipeId: recipe.id,
                        ingredientId: r.ing.id,
                        quantity: r.qty,
                        unitId: r.unit.id
                    }
                });
            }
        }
    }
    await prisma.businessSettings.upsert({
        where: { id: 'default' },
        update: {
            cafeName: 'Nitsuh Foods & Cafe',
            currencySymbol: 'ETB',
            address: 'Addis Ababa, Ethiopia',
            phone: '0966833177',
            email: 'nitsuhfoods@gmail.com',
            receiptFooterMessage: 'From Savour Bites to Sweet Delights – We Cater It All! Bookings & Inquiries: 0966833177'
        },
        create: {
            id: 'default',
            cafeName: 'Nitsuh Foods & Cafe',
            currencySymbol: 'ETB',
            taxRate: 15.00,
            serviceChargeRate: 0.00,
            address: 'Addis Ababa, Ethiopia',
            phone: '0966833177',
            email: 'nitsuhfoods@gmail.com',
            receiptFooterMessage: 'From Savour Bites to Sweet Delights – We Cater It All! Bookings & Inquiries: 0966833177'
        }
    });
    console.log('✅ Seed completed successfully with realistic Nitsuh Foods data!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map