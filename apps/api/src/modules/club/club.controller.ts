import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClubRole } from '@prisma/client';
import { type AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateClubService } from './application/create-club.service';
import { ListMyClubsService } from './application/list-my-clubs.service';
import { RotateClubTokensService } from './application/rotate-club-tokens.service';
import { UpdateBankAccountService } from './application/update-bank-account.service';
import { UpdateClubService } from './application/update-club.service';
import type { ClubMembershipRecord } from './club.repository';
import { ClubRoles } from './decorators/club-roles.decorator';
import { CurrentMembership } from './decorators/current-membership.decorator';
import { CreateClubDto } from './dto/create-club.dto';
import { RotateClubTokensDto } from './dto/rotate-club-tokens.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { ClubRoleGuard } from './guards/club-role.guard';

@ApiTags('clubs')
@Controller('clubs')
export class ClubController {
  constructor(
    private readonly createClubService: CreateClubService,
    private readonly listMyClubsService: ListMyClubsService,
    private readonly updateClubService: UpdateClubService,
    private readonly updateBankAccountService: UpdateBankAccountService,
    private readonly rotateClubTokensService: RotateClubTokensService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new club and assign creator as Club ADMIN' })
  createClub(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClubDto) {
    return this.createClubService.execute(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List clubs where the current user is an active member' })
  listMyClubs(@CurrentUser() user: AuthenticatedUser) {
    return this.listMyClubsService.execute(user.id);
  }

  @Get(':clubId')
  @UseGuards(ClubRoleGuard)
  @ApiOperation({ summary: 'Get club details by ID (requires club membership)' })
  getClubById(
    @Param('clubId') clubId: string,
    @CurrentMembership() membership: ClubMembershipRecord,
  ) {
    return this.listMyClubsService.getById(clubId, membership.role);
  }

  @Patch(':clubId')
  @UseGuards(ClubRoleGuard)
  @ClubRoles(ClubRole.ADMIN)
  @ApiOperation({ summary: 'Update club info (requires Club ADMIN)' })
  updateClub(@Param('clubId') clubId: string, @Body() dto: UpdateClubDto) {
    return this.updateClubService.execute(clubId, dto);
  }

  @Put(':clubId/bank-account')
  @UseGuards(ClubRoleGuard)
  @ClubRoles(ClubRole.ADMIN)
  @ApiOperation({ summary: 'Configure club VietQR bank account (requires Club ADMIN)' })
  updateBankAccount(@Param('clubId') clubId: string, @Body() dto: UpdateBankAccountDto) {
    return this.updateBankAccountService.execute(clubId, dto);
  }

  @Post(':clubId/tokens/rotate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClubRoleGuard)
  @ClubRoles(ClubRole.ADMIN)
  @ApiOperation({ summary: 'Regenerate club inviteCode and/or publicToken (requires Club ADMIN)' })
  rotateTokens(@Param('clubId') clubId: string, @Body() dto?: RotateClubTokensDto) {
    return this.rotateClubTokensService.execute(clubId, dto);
  }
}
