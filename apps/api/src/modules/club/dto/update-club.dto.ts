import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateClubDto {
  @ApiPropertyOptional({ example: 'CLB Cầu Lông Sao Mai', maxLength: 100 })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Club name cannot be empty' })
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'CLB cầu lông phong trào tối Thứ 3 - Thứ 5',
    maxLength: 500,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'Sân Cầu Lông Sao Mai, Quận Phú Nhuận, TP.HCM',
    maxLength: 200,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: 260000, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  defaultCourtFee?: number;
}
