import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const message = this.reflector.get<string>('successMessage', context.getHandler()) || 'Request processed successfully';

    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile) {
          return data;
        }
        // If data already has success, message, data structure, return as is
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }
        return {
          success: true,
          message,
          data: data === undefined || data === null ? {} : data,
        };
      }),
    );
  }
}
