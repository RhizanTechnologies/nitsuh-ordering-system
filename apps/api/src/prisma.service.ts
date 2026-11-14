import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma successfully connected to database');
    } catch (err: any) {
      this.logger.error('Database connection error on boot:', err?.message || err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
