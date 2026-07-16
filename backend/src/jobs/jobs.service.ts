import { Injectable, NotFoundException, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument, JobStatus } from './schemas/job.schema';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsQueryDto } from './dto/jobs-query.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private usersService: UsersService,
  ) {}

  async create(createJobDto: CreateJobDto): Promise<JobDocument> {
    const jobData = {
      ...createJobDto,
      scheduledDate: new Date(createJobDto.scheduledDate),
      location: {
        type: 'Point',
        coordinates: [createJobDto.longitude, createJobDto.latitude], // GeoJSON is [longitude, latitude]
      },
      status: JobStatus.PENDING,
      assignedTechnician: null,
    };

    const newJob = new this.jobModel(jobData);
    return newJob.save();
  }

  async findAll(queryDto: JobsQueryDto) {
    const { page, limit, status, technician, startDate, endDate, search, sortBy, sortOrder } = queryDto;
    const query: any = {};

    // 1. Filter by status
    if (status) {
      query.status = status;
    }

    // 2. Filter by technician
    if (technician) {
      if (technician === 'unassigned' || technician === 'none') {
        query.assignedTechnician = null;
      } else {
        if (!Types.ObjectId.isValid(technician)) {
          throw new BadRequestException('Invalid technician ID format');
        }
        query.assignedTechnician = new Types.ObjectId(technician);
      }
    }

    // 3. Filter by date range
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) {
        query.scheduledDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.scheduledDate.$lte = new Date(endDate);
      }
    }

    // 4. Search term (matches title or customer info)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { customerEmail: searchRegex },
        { address: searchRegex },
      ];
    }

    // 5. Query execution & Pagination
    const skip = (page - 1) * limit;
    const sortField = sortBy || 'scheduledDate';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [jobs, total] = await Promise.all([
      this.jobModel
        .find(query)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .populate('assignedTechnician')
        .exec(),
      this.jobModel.countDocuments(query).exec(),
    ]);

    return {
      jobs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<JobDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid job ID format');
    }

    const job = await this.jobModel.findById(id).populate('assignedTechnician').exec();
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  async assignTechnician(id: string, technicianId: string): Promise<JobDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid job ID format');
    }
    if (!Types.ObjectId.isValid(technicianId)) {
      throw new BadRequestException('Invalid technician ID format');
    }

    // Check if technician exists and is a technician
    const tech = await this.usersService.findById(technicianId);
    if (!tech) {
      throw new NotFoundException(`Technician with ID ${technicianId} not found`);
    }
    if (tech.role !== 'TECHNICIAN') {
      throw new UnprocessableEntityException(`User ${technicianId} is not a TECHNICIAN`);
    }

    const job = await this.jobModel.findById(id).exec();
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (job.status !== JobStatus.PENDING) {
      throw new UnprocessableEntityException(
        `Cannot assign technician when job status is ${job.status}. Only PENDING jobs can be assigned.`,
      );
    }

    job.assignedTechnician = new Types.ObjectId(technicianId) as any;
    job.status = JobStatus.ASSIGNED;

    const savedJob = await job.save();
    return this.findById(savedJob.id);
  }

  async unassignTechnician(id: string): Promise<JobDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid job ID format');
    }

    const job = await this.jobModel.findById(id).exec();
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (job.status !== JobStatus.ASSIGNED) {
      throw new UnprocessableEntityException(
        `Cannot unassign technician when job status is ${job.status}. Only ASSIGNED jobs can be unassigned.`,
      );
    }

    job.assignedTechnician = null;
    job.status = JobStatus.PENDING;

    const savedJob = await job.save();
    return this.findById(savedJob.id);
  }

  async cancelJob(id: string, reason: string): Promise<JobDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid job ID format');
    }

    const job = await this.jobModel.findById(id).exec();
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (job.status === JobStatus.COMPLETED) {
      throw new UnprocessableEntityException('Cannot cancel a completed job');
    }
    if (job.status === JobStatus.CANCELLED) {
      throw new UnprocessableEntityException('Job is already cancelled');
    }

    job.status = JobStatus.CANCELLED;
    job.cancelReason = reason;
    job.cancelledAt = new Date();

    const savedJob = await job.save();
    return this.findById(savedJob.id);
  }
}
