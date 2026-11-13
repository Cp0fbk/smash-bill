import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClubService } from './club.service';

@ApiTags('clubs')
@Controller('clubs')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get club details by slug' })
  getClubBySlug(@Param('slug') slug: string) {
    return this.clubService.findBySlug(slug);
  }
}
