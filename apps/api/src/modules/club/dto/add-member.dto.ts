import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClubRole } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ example: 'Trần Hoàng Nam' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName!: string;

  @ApiPropertyOptional({ example: '0912 345 678' })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  phone?: string;

  @ApiPropertyOptional({ enum: ClubRole, default: ClubRole.MEMBER })
  @IsOptional()
  @IsEnum(ClubRole)
  role?: ClubRole;
}
