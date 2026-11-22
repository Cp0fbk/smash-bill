import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class RotateClubTokensDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  rotateInviteCode?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  rotatePublicToken?: boolean;
}
