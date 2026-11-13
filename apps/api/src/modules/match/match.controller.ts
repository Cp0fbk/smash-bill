import { Controller, Get, Param } from '@nestjs/common';
import { MatchService } from './match.service';

@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get(':id')
  getMatchById(@Param('id') id: string) {
    return this.matchService.findById(id);
  }
}
