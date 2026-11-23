import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class JoinByInviteDto {
  @ApiProperty({ example: 'Lê Thu Hà' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName!: string;

  @ApiPropertyOptional({ example: '0987 654 321' })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  phone?: string;

  @ApiPropertyOptional({ enum: ['REGULAR', 'GUEST'], default: 'REGULAR' })
  @IsOptional()
  @IsIn(['REGULAR', 'GUEST'])
  type?: 'REGULAR' | 'GUEST';
}
