import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { UploadsService } from './uploads.service';

/** Serves completion photo URLs; not part of mobile API surface (hidden from /docs). */
@ApiExcludeController()
@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Get('files/:key')
  async getFile(@Param('key') key: string, @Res() res: Response) {
    const filePath = this.uploadsService.getUploadedFile(key);
    const contentType = this.uploadsService.getContentType(key);
    return res.sendFile(filePath, { headers: { 'Content-Type': contentType } });
  }
}
