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

      // Auto-migration: Ensure Order orderNumber supports daily reset (non-unique across all days)
      try {
        await this.$executeRawUnsafe(`DROP INDEX IF EXISTS "Order_orderNumber_key";`);
        await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Order_orderNumber_idx" ON "Order"("orderNumber");`);
        this.logger.log('Auto-migration: Ensured Order_orderNumber_key unique constraint is relaxed for daily resets.');
      } catch (idxErr: any) {
        this.logger.warn(`Could not update orderNumber index: ${idxErr?.message}`);
      }
    } catch (err: any) {
      this.logger.error('Database connection error on boot:', err?.message || err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
