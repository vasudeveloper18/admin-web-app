import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({ example: 'HVAC Maintenance', description: 'The title of the job' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @ApiProperty({ example: 'Standard seasonal inspection of AC units.', description: 'Job description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'John Doe', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  customerName!: string;

  @ApiProperty({ example: '+15550199', description: 'Customer phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Customer phone is required' })
  customerPhone!: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Customer email' })
  @IsEmail({}, { message: 'Customer email must be a valid email' })
  @IsNotEmpty({ message: 'Customer email is required' })
  customerEmail!: string;

  @ApiProperty({ example: '123 Main St, Boston, MA', description: 'Service address' })
  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address!: string;

  @ApiProperty({ example: 42.3601, description: 'Address latitude coordinate' })
  @IsNumber({}, { message: 'Latitude must be a number' })
  latitude!: number;

  @ApiProperty({ example: -71.0589, description: 'Address longitude coordinate' })
  @IsNumber({}, { message: 'Longitude must be a number' })
  longitude!: number;

  @ApiProperty({ example: '2026-07-20T10:00:00Z', description: 'ISO date string of when the job is scheduled' })
  @IsDateString({}, { message: 'Scheduled date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'Scheduled date is required' })
  scheduledDate!: string;
}
