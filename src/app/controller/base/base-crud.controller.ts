import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Roles, RolesGuard } from '@ubs-platform/users-mona-roles';
import { JwtAuthGuard } from '@ubs-platform/users-mona-microservice-helper';
import { IBaseCrudService } from 'src/app/service/base/base-crud.service';
import {
  ControllerConfiguration,
  RoleAuthorization,
  RoleAuthorizationConfigKey,
  RoleAuthorizationDetailed,
} from './controller-configuration';

export const BaseCrudControllerGenerator = <
  MODEL,
  INPUT extends { _id },
  OUTPUT,
  SEARCH
>(
  r?: ControllerConfiguration
) => {
  const findExistAuth = (field: RoleAuthorizationConfigKey) => {
    let a = r.authorization[field] || r.authorization.ALL;
    if (a === true) {
      return {
        needsAuthenticated: true,
        roles: [],
      } as RoleAuthorizationDetailed;
    } else if (!a) {
      return {
        needsAuthenticated: false,
        roles: [],
      } as RoleAuthorizationDetailed;
    } else {
      return a as RoleAuthorizationDetailed;
    }
  };

  const RoleConfig = (field: RoleAuthorizationConfigKey) => {
    let authorization = findExistAuth(field);
    // if (meta == null) meta = {};
    const guard = UseGuards(
      ...[
        authorization.needsAuthenticated ? JwtAuthGuard : null,
        authorization.needsAuthenticated && authorization.roles
          ? RolesGuard
          : null,
      ].filter((a) => a)
    );
    const roles = Roles(authorization.roles);

    return (target, propKey, descriptor) => {
      guard(target, propKey, descriptor);
      roles(target, propKey, descriptor);
    };
  };

  class ControllerClass {
    constructor(
      private service: IBaseCrudService<MODEL, INPUT, OUTPUT, SEARCH>
    ) {}

    // @UseGuards(...generateGuardAndRolesEtc('GETALL')[0])
    // @Roles(generateGuardAndRolesEtc('GETALL')[1])
    @RoleConfig('GETALL')
    @Get()
    async fetchAll(@Query() s?: SEARCH) {
      return await this.service.fetchAll(s);
    }
    @RoleConfig('GETALL')
    @Get('_search')
    async search(@Query() s?: SEARCH & { page?: number; size?: number }) {
      return await this.service.searchPagination(s);
    }
    @Get('/:id')
    @RoleConfig('GETID')
    async fetchOne(@Param() { id }: { id: any }) {
      return await this.service.fetchOne(id);
    }

    @RoleConfig('ADD')
    @Post()
    async add(@Body() body: INPUT) {
      return await this.service.create(body);
    }

    @RoleConfig('EDIT')
    @Put()
    async edit(@Body() body: INPUT) {
      if (body._id == null) {
        throw new NotFoundException();
      }
      return await this.service.edit(body);
    }

    @Delete(':id')
    @RoleConfig('REMOVE')
    async remove(@Param() { id }: { id: any }) {}
  }

  return ControllerClass;
};
