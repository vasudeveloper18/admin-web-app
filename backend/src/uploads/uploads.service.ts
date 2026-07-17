import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly uploadsDir: string;

  constructor(private configService: ConfigService) {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /** Public origin for completion photo links (must be reachable by mobile/admin clients). */
  getPublicBaseUrl(): string {
    const configured =
      this.configService.get<string>('API_BASE_URL')?.trim() ||
      this.configService.get<string>('RENDER_EXTERNAL_URL')?.trim();
    if (configured) {
      return configured.replace(/\/$/, '');
    }
    const port = this.configService.get<string>('PORT') || '3001';
    return `http://127.0.0.1:${port}`;
  }

  /** Turn stored path or legacy absolute URL into a client-accessible URL. */
  resolvePhotoUrl(stored: string): string {
    if (!stored) {
      return stored;
    }
    const base = this.getPublicBaseUrl();
    if (stored.startsWith('/')) {
      return `${base}${stored}`;
    }
    try {
      const pathname = new URL(stored).pathname;
      if (pathname.startsWith('/uploads/files/')) {
        return `${base}${pathname}`;
      }
    } catch {
      /* not a URL */
    }
    return stored;
  }

  resolvePhotoUrls(urls: string[]): string[] {
    return urls.map((u) => this.resolvePhotoUrl(u));
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
      urls.push(`/uploads/files/${key}`);
    }

    return urls;
  }

  getUploadedFile(key: string) {
    const safeKey = path.basename(key);
    if (safeKey !== key || !/^[a-f0-9]+\.(jpg|jpeg|png|webp|gif)$/i.test(safeKey)) {
      throw new NotFoundException('File not found');
    }
    const filePath = path.join(this.uploadsDir, safeKey);
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
