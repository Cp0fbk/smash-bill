import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'smash-bill-api',
      niche: 'badminton',
      timestamp: new Date().toISOString(),
    };
  }
}
