import { Controller, Get, Query, ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard(
    @Query('timeframe') timeframe?: 'day' | 'week' | 'month' | 'year',
    @Query('role') role?: string,
  ) {
    if (role && role !== 'OWNER') {
      throw new ForbiddenException('Executive profit and financial analytics are strictly restricted to the Owner.');
    }
    return this.analyticsService.getExecutiveDashboard(timeframe);
  }
}
