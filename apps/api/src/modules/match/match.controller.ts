import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { MatchService } from './match.service';

@ApiTags('matches')
@Public()
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get match session details by ID' })
  getMatchById(@Param('id') id: string) {
    return this.matchService.findById(id);
  }
}
