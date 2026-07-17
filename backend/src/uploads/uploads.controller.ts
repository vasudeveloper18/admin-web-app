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
    const { stream, contentType } = await this.uploadsService.openPhotoStream(key);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(404).end();
      }
    });
    stream.pipe(res);
  }
}
