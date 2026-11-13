import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Clock } from '../../common/clock/clock';
import { CLOCK } from '../../common/constants/injection-tokens';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(CLOCK) private readonly clock: Clock) {}

  @Get()
  @ApiOperation({ summary: 'Service liveness and readiness check' })
  check() {
    return {
      status: 'ok',
      service: 'smash-bill-api',
      niche: 'badminton',
      timestamp: this.clock.now().toISOString(),
    };
  }
}
