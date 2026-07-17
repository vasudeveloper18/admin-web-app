import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly uploadsDir: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    this.baseUrl =
      this.configService.get<string>('API_BASE_URL') ||
      `http://127.0.0.1:${this.configService.get<string>('PORT') || '3001'}`;
  }

  saveCompletionPhotos(files: { buffer: Buffer; originalname: string; mimetype: string }[]): string[] {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    const urls: string[] = [];

    for (const file of files) {
      if (!allowed.has(file.mimetype)) {
        throw new BadRequestException(
          `Invalid photo type ${file.mimetype}. Allowed: jpeg, png, webp, gif.`,
        );
      }
      const ext = path.extname(file.originalname) || this.extFromMime(file.mimetype);
      const key = `${randomBytes(16).toString('hex')}${ext}`;
      fs.writeFileSync(path.join(this.uploadsDir, key), file.buffer);
      urls.push(`${this.baseUrl}/uploads/files/${key}`);
    }

    return urls;
  }

  getUploadedFile(key: string) {
    const filePath = path.join(this.uploadsDir, key);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    return filePath;
  }

  getContentType(key: string): string {
    const ext = path.extname(key).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private extFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    return map[mime] || '.bin';
  }
}
