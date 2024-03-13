import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { Roles, RolesGuard } from '@ubs-platform/users-mona-roles';
import { JwtAuthGuard } from '@ubs-platform/users-mona-microservice-helper';

export const BaseSimpleControllerBuilder = <OUTPUT>(
  authenticated: boolean,
  resp: OUTPUT
) => {
  class BaseSimpleController {
    @UseGuards(authenticated ? JwtAuthGuard : undefined)
    @Get()
    async fetchAll(): Promise<OUTPUT> {
      return resp;
    }
  }

  return BaseSimpleController;
};
