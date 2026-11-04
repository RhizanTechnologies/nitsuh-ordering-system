import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Module({
  controllers: [MenuController],
  providers: [MenuService, PrismaService, EventsGateway],
  exports: [MenuService],
})
export class MenuModule {}
