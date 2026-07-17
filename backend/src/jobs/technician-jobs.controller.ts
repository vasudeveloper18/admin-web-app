import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { UploadsService } from '../uploads/uploads.service';
import { MyJobsQueryDto } from './dto/my-jobs-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { JobStatus } from './schemas/job.schema';

@ApiTags('Mobile (Technician)')
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TECHNICIAN')
@ApiBearerAuth()
export class TechnicianJobsController {
  constructor(
    private jobsService: JobsService,
    private uploadsService: UploadsService,
  ) {}

  @Get('my')
  @SuccessMessage('My jobs retrieved successfully')
  @ApiOperation({
    summary: 'My assigned jobs',
    description:
      'Returns all jobs assigned to the logged-in technician in one list. Optional `status` filter. Pagination is handled in the mobile app.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: JobStatus,
    description: 'ASSIGNED | IN_PROGRESS | COMPLETED',
  })
  @ApiQuery({ name: 'sortBy', required: false, example: 'scheduledDate' })
  @ApiQuery({ name: 'sortOrder', required: false, example: 'desc', enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Returns data.jobs (array). No page/limit.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'TECHNICIAN role required' })
  async findMyJobs(@Req() req: { user: { sub: string } }, @Query() query: MyJobsQueryDto) {
    return this.jobsService.findMyJobs(req.user.sub, query);
  }

  @Patch(':id/start')
  @SuccessMessage('Job started successfully')
  @ApiOperation({
    summary: 'Start job',
    description: 'No body. Status **ASSIGNED** → **IN_PROGRESS**. Job must be assigned to you.',
  })
  @ApiParam({ name: 'id', description: 'Job MongoDB ObjectId', example: '674a1b2c3d4e5f6789012345' })
  @ApiResponse({ status: 200, description: 'Job with status IN_PROGRESS.' })
  @ApiResponse({ status: 403, description: 'Job not assigned to this technician.' })
  @ApiResponse({ status: 422, description: 'Job status is not ASSIGNED.' })
  async startJob(@Param('id') id: string, @Req() req: { user: { sub: string } }) {
    return this.jobsService.startJob(id, req.user.sub);
  }

  @Patch(':id/complete')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'photos', maxCount: 10 }]))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Job MongoDB ObjectId', example: '674a1b2c3d4e5f6789012345' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['completionNotes', 'photos'],
      properties: {
        completionNotes: {
          type: 'string',
          example: 'Replaced filter and verified system operation.',
        },
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @SuccessMessage('Job completed successfully')
  @ApiOperation({
    summary: 'Complete job (one call)',
    description: 'multipart/form-data: completionNotes + photos files. Status **IN_PROGRESS** → **COMPLETED**.',
  })
  @ApiResponse({ status: 200, description: 'Job COMPLETED with completionNotes and completionPhotos URLs.' })
  @ApiResponse({ status: 400, description: 'Missing completionNotes or photos.' })
  @ApiResponse({ status: 403, description: 'Job not assigned to this technician.' })
  @ApiResponse({ status: 422, description: 'Job status is not IN_PROGRESS.' })
  async completeJob(
    @Param('id') id: string,
    @Req() req: { user: { sub: string } },
    @Body('completionNotes') completionNotes: string,
    @UploadedFiles()
    files?: { photos?: { buffer: Buffer; originalname: string; mimetype: string; size: number }[] },
  ) {
    const notes = completionNotes?.trim();
    if (!notes) {
      throw new BadRequestException('completionNotes is required');
    }

    const uploaded = files?.photos?.filter((f) => f?.size > 0) ?? [];
    if (uploaded.length === 0) {
      throw new BadRequestException('At least one photo file is required (field name: photos)');
    }

    const photoUrls = this.uploadsService.saveCompletionPhotos(uploaded);
    return this.jobsService.completeJob(id, req.user.sub, {
      completionNotes: notes,
      completionPhotos: photoUrls,
    });
  }
}
