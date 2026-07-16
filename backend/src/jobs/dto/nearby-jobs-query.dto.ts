import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NearbyJobsQueryDto {
  @ApiProperty({ example: 42.3601, description: 'Current latitude' })
  @Type(() => Number)
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: -71.0589, description: 'Current longitude' })
  @Type(() => Number)
  @IsNumber()
  lng!: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Search radius in kilometers (default 10, max 50)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(50)
  @IsOptional()
  radius = 10;
}
