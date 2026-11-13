import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('providers')
  @ApiOperation({ summary: 'List supported SSO providers (Google & Zalo)' })
  getSupportedProviders() {
    return this.authService.getSupportedProviders();
  }
}
