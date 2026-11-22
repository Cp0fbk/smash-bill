import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateClubDto {
  @ApiProperty({ example: 'CLB Sao Mai', maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Club name is required' })
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    example: 'CLB cầu lông phong trào tối Thứ 3 - Thứ 5 - Chủ Nhật',
    maxLength: 500,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'Sân Cầu Lông Sao Mai, Phú Nhuận, TP.HCM',
    maxLength: 200,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: 240000, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  defaultCourtFee?: number;
}
