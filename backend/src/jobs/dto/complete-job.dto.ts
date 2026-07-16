import { IsArray, IsNotEmpty, IsOptional, IsString, IsUrl, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteJobDto {
  @ApiProperty({ example: 'Replaced filter and verified system operation.', description: 'Completion notes' })
  @IsString()
  @IsNotEmpty({ message: 'Completion notes are required' })
  completionNotes!: string;

  @ApiProperty({
    example: ['https://example.com/uploads/photo1.jpg'],
    description: 'URLs of uploaded completion photos (from presign flow)',
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMinSize(1, { message: 'At least one completion photo URL is required' })
  completionPhotos!: string[];
}
