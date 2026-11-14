import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'Nitsuh Cafe API',
      message: '☕ Nitsuh Cafe API is running on Vercel Serverless',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('api')
  getApiHealth() {
    return this.getHealth();
  }

  @Get('health')
  getHealthCheck() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
