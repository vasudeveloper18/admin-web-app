import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelJobDto {
  @ApiProperty({ example: 'Customer cancelled the appointment.', description: 'The reason for job cancellation' })
  @IsString()
  @IsNotEmpty({ message: 'Cancellation reason is required' })
  @MinLength(5, { message: 'Reason must be at least 5 characters long' })
  reason!: string;
}
