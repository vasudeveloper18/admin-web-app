import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { TechnicianJobsController } from './technician-jobs.controller';
import { Job, JobSchema } from './schemas/job.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
    UsersModule,
    JwtModule,
    ConfigModule,
  ],
  controllers: [TechnicianJobsController, JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
