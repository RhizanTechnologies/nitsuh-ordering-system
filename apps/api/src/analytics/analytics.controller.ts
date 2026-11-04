import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard(@Query('timeframe') timeframe?: 'day' | 'week' | 'month' | 'year') {
    return this.analyticsService.getExecutiveDashboard(timeframe);
  }
}
