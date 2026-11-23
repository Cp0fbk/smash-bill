import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClubRole } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListMembersQueryDto {
  @ApiPropertyOptional({ enum: ClubRole })
  @IsOptional()
  @IsEnum(ClubRole)
  role?: ClubRole;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  active?: 'true' | 'false';

  @ApiPropertyOptional({ example: 'minh' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
