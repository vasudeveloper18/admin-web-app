import { IsOptional, IsString, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '../schemas/job.schema';

export class JobsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({ example: 10, description: 'Number of items per page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit = 10;

  @ApiPropertyOptional({ enum: JobStatus, description: 'Filter by job status' })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;

  @ApiPropertyOptional({ description: 'Filter by assigned technician ID' })
  @IsString()
  @IsOptional()
  technician?: string;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00Z', description: 'Start date for filtering by scheduled date range' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z', description: 'End date for filtering by scheduled date range' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search term for title or customer name/phone/email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'scheduledDate', description: 'Field to sort by (e.g. scheduledDate, title, status)' })
  @IsString()
  @IsOptional()
  sortBy = 'scheduledDate';

  @ApiPropertyOptional({ example: 'desc', description: 'Sort direction (asc or desc)' })
  @IsString()
  @IsOptional()
  sortOrder = 'desc';
}
