import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import {
  ApplicationSocialRestrictionSearchDTO,
  ApplicationSocialRestrictionAddDTO,
} from 'libs/common/src';
import { ApplicationSocialRestrictionService } from '../service/application-social-restriction.service';

@Controller('application-social-restriction')
export class ApplicationSocialRestrictionController {
  constructor(private srs: ApplicationSocialRestrictionService) {}

  @Get('admin/:userId/:restriction')
  async restrictionDetail(
    @Param() search: ApplicationSocialRestrictionSearchDTO
  ) {
    return await this.srs.userRestrictionDetails(search);
  }

  @Get(':userId/:restriction')
  async hasRestriction(@Param() search: ApplicationSocialRestrictionSearchDTO) {
    return await this.srs.isUserRestrictedFrom(search);
  }

  @Post('admin')
  async addRestriction(@Body() p: ApplicationSocialRestrictionAddDTO) {
    debugger;
    return await this.srs.restrictUser(p);
  }

  @Delete('admin/:userId/:restriction')
  async removeRestriction(@Param() p: ApplicationSocialRestrictionSearchDTO) {
    return await this.srs.removeCommentRestriction(p);
  }
}
