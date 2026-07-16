import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsQueryDto } from './dto/jobs-query.dto';
import { AssignJobDto } from './dto/assign-job.dto';
import { CancelJobDto } from './dto/cancel-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SuccessMessage } from '../common/decorators/success-message.decorator';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post()
  @SuccessMessage('Job created successfully')
  @ApiOperation({ summary: 'Create a new service job' })
  @ApiResponse({ status: 201, description: 'Job successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input parameters.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN only.' })
  async create(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(createJobDto);
  }

  @Get()
  @SuccessMessage('Jobs list retrieved successfully')
  @ApiOperation({ summary: 'Get list of jobs with pagination, filtering, searching and sorting' })
  @ApiResponse({ status: 200, description: 'Paginated list of jobs.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN only.' })
  async findAll(@Query() query: JobsQueryDto) {
    return this.jobsService.findAll(query);
  }

  @Get(':id')
  @SuccessMessage('Job details retrieved successfully')
  @ApiOperation({ summary: 'Get job details by ID' })
  @ApiResponse({ status: 200, description: 'Detailed job record.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN only.' })
  async findOne(@Param('id') id: string) {
    return this.jobsService.findById(id);
  }

  @Patch(':id/assign')
  @SuccessMessage('Technician assigned successfully')
  @ApiOperation({ summary: 'Assign a technician to a job' })
  @ApiResponse({ status: 200, description: 'Job assigned successfully.' })
  @ApiResponse({ status: 404, description: 'Job or technician not found.' })
  @ApiResponse({ status: 422, description: 'Unprocessable transaction (e.g. invalid user role or terminal job state).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN only.' })
  async assign(@Param('id') id: string, @Body() assignJobDto: AssignJobDto) {
    return this.jobsService.assignTechnician(id, assignJobDto.technicianId);
  }

  @Patch(':id/unassign')
  @SuccessMessage('Technician unassigned successfully')
  @ApiOperation({ summary: 'Unassign technician from a job' })
  @ApiResponse({ status: 200, description: 'Job unassigned successfully.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  @ApiResponse({ status: 422, description: 'Unprocessable transaction (e.g. job already completed).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN only.' })
  async unassign(@Param('id') id: string) {
    return this.jobsService.unassignTechnician(id);
  }

  @Patch(':id/cancel')
  @SuccessMessage('Job cancelled successfully')
  @ApiOperation({ summary: 'Cancel a job with a reason' })
  @ApiResponse({ status: 200, description: 'Job cancelled successfully.' })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  @ApiResponse({ status: 422, description: 'Unprocessable transaction (e.g. job already completed).' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN only.' })
  async cancel(@Param('id') id: string, @Body() cancelJobDto: CancelJobDto) {
    return this.jobsService.cancelJob(id, cancelJobDto.reason);
  }
}
