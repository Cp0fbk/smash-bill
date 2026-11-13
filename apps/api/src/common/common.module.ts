import { Global, Module } from '@nestjs/common';
import { SystemClock } from './clock/clock';
import { CLOCK } from './constants/injection-tokens';

@Global()
@Module({
  providers: [
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
  ],
  exports: [CLOCK],
})
export class CommonModule {}
