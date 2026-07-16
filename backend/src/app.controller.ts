import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Admin Web App API is running. Visit /docs for Swagger documentation.';
  }
}
