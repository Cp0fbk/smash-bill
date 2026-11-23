import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClubRole } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMemberDto {
  @ApiPropertyOptional({ example: 'Trần Hoàng Nam' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName?: string;

  @ApiPropertyOptional({ example: '0912345678', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  phone?: string | null;

  @ApiPropertyOptional({ enum: ClubRole })
  @IsOptional()
  @IsEnum(ClubRole)
  role?: ClubRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
