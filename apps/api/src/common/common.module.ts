import { Global, Module } from '@nestjs/common';
import { SystemClock } from './clock/clock';
import { CLOCK, TOKEN_GENERATOR } from './constants/injection-tokens';
import { NanoidTokenGenerator } from './tokens/token-generator';

@Global()
@Module({
  providers: [
    {
      provide: CLOCK,
      useClass: SystemClock,
    },
    {
      provide: TOKEN_GENERATOR,
      useClass: NanoidTokenGenerator,
    },
  ],
  exports: [CLOCK, TOKEN_GENERATOR],
})
export class CommonModule {}
