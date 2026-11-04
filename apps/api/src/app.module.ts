import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { EventsGateway } from './events/events.gateway';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    AuthModule,
    MenuModule,
    InventoryModule,
    OrdersModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [PrismaService, EventsGateway],
})
export class AppModule {}
