import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { JoinByInviteService } from './application/join-by-invite.service';
import { JoinByInviteDto } from './dto/join-by-invite.dto';

@ApiTags('public-invite')
@Controller('public/invite')
export class PublicInviteController {
  constructor(private readonly joinByInviteService: JoinByInviteService) {}

  @Public()
  @Get(':inviteCode')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Get public club invite preview (name, location, member count)' })
  getInviteInfo(@Param('inviteCode') inviteCode: string) {
    return this.joinByInviteService.getInviteInfo(inviteCode);
  }

  @Public()
  @Post(':inviteCode/join')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Self-join club roster via invite QR/code without an account (throttled 5/min/IP)',
  })
  joinByInvite(@Param('inviteCode') inviteCode: string, @Body() dto: JoinByInviteDto) {
    return this.joinByInviteService.join(inviteCode, dto);
  }
}
