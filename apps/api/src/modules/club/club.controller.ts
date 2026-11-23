import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClubRole } from '@prisma/client';
import { type AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { AddMemberService } from './application/add-member.service';
import { CreateClubService } from './application/create-club.service';
import { DeactivateMemberService } from './application/deactivate-member.service';
import { ListMembersService } from './application/list-members.service';
import { ListMyClubsService } from './application/list-my-clubs.service';
import { RotateClubTokensService } from './application/rotate-club-tokens.service';
import { UpdateBankAccountService } from './application/update-bank-account.service';
import { UpdateClubService } from './application/update-club.service';
import { UpdateMemberService } from './application/update-member.service';
import type { ClubMembershipRecord } from './club.repository';
import { ClubRoles } from './decorators/club-roles.decorator';
import { CurrentMembership } from './decorators/current-membership.decorator';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateClubDto } from './dto/create-club.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { RotateClubTokensDto } from './dto/rotate-club-tokens.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
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
    private readonly listMembersService: ListMembersService,
    private readonly addMemberService: AddMemberService,
    private readonly updateMemberService: UpdateMemberService,
    private readonly deactivateMemberService: DeactivateMemberService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new club and assign creator as Club HOST' })
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
  @ClubRoles(ClubRole.HOST)
  @ApiOperation({ summary: 'Update club info (requires Club HOST)' })
  updateClub(@Param('clubId') clubId: string, @Body() dto: UpdateClubDto) {
    return this.updateClubService.execute(clubId, dto);
  }

  @Put(':clubId/bank-account')
  @UseGuards(ClubRoleGuard)
  @ClubRoles(ClubRole.HOST)
  @ApiOperation({ summary: 'Configure club VietQR bank account (requires Club HOST)' })
  updateBankAccount(@Param('clubId') clubId: string, @Body() dto: UpdateBankAccountDto) {
    return this.updateBankAccountService.execute(clubId, dto);
  }

  @Post(':clubId/tokens/rotate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClubRoleGuard)
  @ClubRoles(ClubRole.HOST)
  @ApiOperation({ summary: 'Regenerate club inviteCode and/or publicToken (requires Club HOST)' })
  rotateTokens(@Param('clubId') clubId: string, @Body() dto?: RotateClubTokensDto) {
    return this.rotateClubTokensService.execute(clubId, dto);
  }

  @Get(':clubId/members')
  @UseGuards(ClubRoleGuard)
  @ApiOperation({ summary: 'List club roster with optional role, active, and name/phone search' })
  listMembers(@Param('clubId') clubId: string, @Query() query: ListMembersQueryDto) {
    return this.listMembersService.execute(clubId, query);
  }

  @Post(':clubId/members')
  @UseGuards(ClubRoleGuard)
  @ClubRoles(ClubRole.HOST)
  @ApiOperation({ summary: 'Add a member to the club roster (requires Club HOST)' })
  addMember(@Param('clubId') clubId: string, @Body() dto: AddMemberDto) {
    return this.addMemberService.execute(clubId, dto);
  }

  @Patch(':clubId/members/:memberId')
  @UseGuards(ClubRoleGuard)
  @ClubRoles(ClubRole.HOST)
  @ApiOperation({ summary: 'Update member name, phone, role or status (requires Club HOST)' })
  updateMember(
    @Param('clubId') clubId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.updateMemberService.execute(clubId, memberId, dto);
  }

  @Delete(':clubId/members/:memberId')
  @UseGuards(ClubRoleGuard)
  @ClubRoles(ClubRole.HOST)
  @ApiOperation({ summary: 'Soft-deactivate a club member (isActive = false, requires Club HOST)' })
  deactivateMember(@Param('clubId') clubId: string, @Param('memberId') memberId: string) {
    return this.deactivateMemberService.execute(clubId, memberId);
  }
}
