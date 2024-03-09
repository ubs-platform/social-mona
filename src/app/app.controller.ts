import { Controller, Get, UseGuards } from '@nestjs/common';

import { AppService } from './app.service';
import { Roles, RolesGuard } from '@ubs-platform/users-mona-roles';
import { JwtAuthGuard } from '@ubs-platform/users-mona-microservice-helper';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Roles(['ADMIN'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  getData() {
    return this.appService.getData();
  }
}
