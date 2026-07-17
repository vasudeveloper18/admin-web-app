import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '../schemas/job.schema';

export class MyJobsQueryDto {
  @ApiPropertyOptional({
    enum: JobStatus,
    description: 'Optional filter: ASSIGNED | IN_PROGRESS | COMPLETED (app handles paging locally)',
  })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;

  @ApiPropertyOptional({ example: 'scheduledDate', description: 'Sort field (default scheduledDate)' })
  @IsString()
  @IsOptional()
  sortBy = 'scheduledDate';

  @ApiPropertyOptional({ example: 'desc', description: 'Sort direction (default desc)' })
  @IsString()
  @IsOptional()
  sortOrder = 'desc';
}
