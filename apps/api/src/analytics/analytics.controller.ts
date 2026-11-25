import { Controller, Get, Query, ForbiddenException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@UseGuards(AuthGuard('jwt'))
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
