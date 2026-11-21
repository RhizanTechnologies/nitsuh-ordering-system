import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma successfully connected to database');
      try {
        await this.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "notes" TEXT;`);
        this.logger.log('Auto-migration: Ensured "notes" column exists on Order table.');
      } catch (colErr: any) {
        this.logger.warn(`Could not run notes column migration: ${colErr?.message}`);
      }
    } catch (err: any) {
      this.logger.error('Database connection error on boot:', err?.message || err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
