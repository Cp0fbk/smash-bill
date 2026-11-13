import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';

@ApiTags('matches')
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get match session details by ID' })
  getMatchById(@Param('id') id: string) {
    return this.matchService.findById(id);
  }
}
