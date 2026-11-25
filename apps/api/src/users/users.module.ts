import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, EventsGateway],
  exports: [UsersService],
})
export class UsersModule {}
