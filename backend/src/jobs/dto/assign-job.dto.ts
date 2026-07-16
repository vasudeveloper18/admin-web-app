import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignJobDto {
  @ApiProperty({ example: '60d5ecb8b5de3b3f40f3b482', description: 'The MongoDB ObjectId of the technician' })
  @IsString()
  @IsNotEmpty({ message: 'Technician ID is required' })
  technicianId!: string;
}
