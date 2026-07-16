import { Controller, Get, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { MyJobsQueryDto } from './dto/my-jobs-query.dto';
import { NearbyJobsQueryDto } from './dto/nearby-jobs-query.dto';
import { CompleteJobDto } from './dto/complete-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SuccessMessage } from '../common/decorators/success-message.decorator';

@ApiTags('Technician Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TECHNICIAN')
@ApiBearerAuth()
export class TechnicianJobsController {
  constructor(private jobsService: JobsService) {}

  @Get('my')
  @SuccessMessage('My jobs retrieved successfully')
  @ApiOperation({ summary: 'Get jobs assigned to the logged-in technician' })
  @ApiResponse({ status: 200, description: 'Paginated list of assigned jobs.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - TECHNICIAN only.' })
  async findMyJobs(@Req() req: any, @Query() query: MyJobsQueryDto) {
    return this.jobsService.findMyJobs(req.user.sub, query);
  }

  @Get('nearby')
  @SuccessMessage('Nearby jobs retrieved successfully')
  @ApiOperation({ summary: 'Get unassigned pending jobs near a location' })
  @ApiResponse({ status: 200, description: 'List of nearby unassigned jobs with distance.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - TECHNICIAN only.' })
  async findNearby(@Query() query: NearbyJobsQueryDto) {
    return this.jobsService.findNearby(query);
  }

  @Patch(':id/start')
  @SuccessMessage('Job started successfully')
  @ApiOperation({ summary: 'Start an assigned job (ASSIGNED → IN_PROGRESS)' })
  @ApiResponse({ status: 200, description: 'Job started successfully.' })
  @ApiResponse({ status: 403, description: 'Job not assigned to this technician.' })
  @ApiResponse({ status: 422, description: 'Invalid job status for start.' })
  async startJob(@Param('id') id: string, @Req() req: any) {
    return this.jobsService.startJob(id, req.user.sub);
  }

  @Patch(':id/complete')
  @SuccessMessage('Job completed successfully')
  @ApiOperation({ summary: 'Complete an in-progress job with notes and photos' })
  @ApiResponse({ status: 200, description: 'Job completed successfully.' })
  @ApiResponse({ status: 403, description: 'Job not assigned to this technician.' })
  @ApiResponse({ status: 422, description: 'Invalid job status for completion.' })
  async completeJob(
    @Param('id') id: string,
    @Req() req: any,
    @Body() completeJobDto: CompleteJobDto,
  ) {
    return this.jobsService.completeJob(id, req.user.sub, completeJobDto);
  }
}
