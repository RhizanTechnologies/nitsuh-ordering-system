import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService, EventsGateway],
  exports: [InventoryService],
})
export class InventoryModule {}
