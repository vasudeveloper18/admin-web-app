import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resContent = exception.getResponse() as any;

      if (typeof resContent === 'object' && resContent !== null) {
        message = resContent.message || exception.message;
        // If it's a validation error (from Class Validator), resContent.message is an array of strings
        if (Array.isArray(resContent.message)) {
          message = 'Validation failed';
          errors = resContent.message;
        } else if (resContent.error) {
          errors = [resContent.error];
        }
      } else {
        message = exception.message || String(resContent);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // Do not leak stack traces or verbose system errors in production-like settings
      if (process.env.NODE_ENV === 'development') {
        errors = [exception.stack];
      }
    } else {
      message = String(exception);
    }

    response.status(status).json({
      success: false,
      message,
      errors: errors || [message],
    });
  }
}
