import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

const GRIDFS_BUCKET = 'completionPhotos';

@Injectable()
export class UploadsService {
  private readonly uploadsDir: string;
  private gridfsBucket: GridFSBucket | null = null;

  constructor(
    private configService: ConfigService,
    @InjectConnection() private connection: Connection,
  ) {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  private getBucket(): GridFSBucket {
    if (!this.gridfsBucket) {
      const db = this.connection.db;
      if (!db) {
        throw new Error('MongoDB connection is not ready');
      }
      this.gridfsBucket = new GridFSBucket(db, { bucketName: GRIDFS_BUCKET });
    }
    return this.gridfsBucket;
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

  async saveCompletionPhotos(
    files: { buffer: Buffer; originalname: string; mimetype: string }[],
  ): Promise<string[]> {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    const urls: string[] = [];
    const bucket = this.getBucket();

    for (const file of files) {
      if (!allowed.has(file.mimetype)) {
        throw new BadRequestException(
          `Invalid photo type ${file.mimetype}. Allowed: jpeg, png, webp, gif.`,
        );
      }
      const ext = path.extname(file.originalname) || this.extFromMime(file.mimetype);
      const key = `${randomBytes(16).toString('hex')}${ext}`;
      this.assertSafeFilename(key);

      await this.deleteGridFsByFilename(bucket, key);
      await new Promise<void>((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(key, {
          metadata: { mimetype: file.mimetype },
        });
        uploadStream.on('error', reject);
        uploadStream.on('finish', () => resolve());
        Readable.from(file.buffer).pipe(uploadStream);
      });

      urls.push(`/uploads/files/${key}`);
    }

    return urls;
  }

  async openPhotoStream(key: string): Promise<{ stream: Readable; contentType: string }> {
    const safeKey = this.assertSafeFilename(key);
    const contentType = this.getContentType(safeKey);
    const bucket = this.getBucket();

    const existing = await bucket.find({ filename: safeKey }).limit(1).toArray();
    if (existing.length > 0) {
      return {
        stream: bucket.openDownloadStream(existing[0]._id),
        contentType:
          (existing[0].metadata as { mimetype?: string } | undefined)?.mimetype || contentType,
      };
    }

    const filePath = path.join(this.uploadsDir, safeKey);
    if (fs.existsSync(filePath)) {
      return {
        stream: fs.createReadStream(filePath),
        contentType,
      };
    }

    throw new NotFoundException('File not found');
  }

  private assertSafeFilename(key: string): string {
    const safeKey = path.basename(key);
    if (safeKey !== key || !/^[a-f0-9]+\.(jpg|jpeg|png|webp|gif)$/i.test(safeKey)) {
      throw new NotFoundException('File not found');
    }
    return safeKey;
  }

  private async deleteGridFsByFilename(bucket: GridFSBucket, filename: string): Promise<void> {
    const matches = await bucket.find({ filename }).toArray();
    await Promise.all(matches.map((doc) => bucket.delete(doc._id)));
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
