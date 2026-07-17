import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';

/** Serves completion photo URLs; not part of mobile API surface (hidden from /docs). */
@ApiExcludeController()
@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Get('files/:key')
  @Header('Cache-Control', 'public, max-age=86400')
  async getFile(@Param('key') key: string): Promise<StreamableFile> {
    const { stream, contentType } = await this.uploadsService.openPhotoStream(key);
    return new StreamableFile(stream, { type: contentType, disposition: 'inline' });
  }
}
