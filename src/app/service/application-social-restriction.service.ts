import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApplicationSocialRestriction } from '../model/application-social-restriction';
import {
  ApplicationSocialRestrictionAddDTO,
  ApplicationSocialRestrictionDTO,
  ApplicationSocialRestrictionSearchDTO,
} from 'libs/common/src';

@Injectable()
export class ApplicationSocialRestrictionService {
  constructor(
    @InjectModel(ApplicationSocialRestriction.name)
    private readonly restrictionModel: Model<ApplicationSocialRestriction>
  ) {}

  // Kullanıcıya yorum yapma engeli ekleme. Tarih yoksa endless true olacak
  async restrictUser(
    restrictionAdd: ApplicationSocialRestrictionAddDTO
  ): Promise<ApplicationSocialRestrictionDTO> {
    const endless = restrictionAdd.until == null;
    const until = !endless ? new Date(restrictionAdd.until) : null;
    const ovo = await this.userRestrictionDetailsRaw(restrictionAdd);
    if (ovo) {
      ovo.endless = endless;
      ovo.until = until;
      ovo.note = restrictionAdd.note;
      await ovo.save();
      return this.toDto(ovo);
    } else {
      const restriction = new this.restrictionModel({
        userId: restrictionAdd.userId,
        restriction: restrictionAdd.restriction,
        until,
        note: restrictionAdd.note,
        endless,
      });

      await restriction.save();
      return this.toDto(restriction);
    }
  }

  async userRestrictionDetailsRaw(
    restrictionSearch: ApplicationSocialRestrictionSearchDTO
  ) {
    const now = new Date();

    return await this.restrictionModel.findOne({
      userId: restrictionSearch.userId,
      restriction: restrictionSearch.restriction,
      $or: [{ endless: true }, { until: { $gte: now } }],
    });
  }

  cleanExpired() {
    const now = new Date();
    this.restrictionModel.deleteMany({
      endless: false,
      until: { $lt: now },
    });
  }

  // Kullanıcının yorum yapma engelinin olup olmadığını kontrol etme
  async userRestrictionDetails(
    restrictionSearch: ApplicationSocialRestrictionSearchDTO
  ): Promise<ApplicationSocialRestrictionDTO> {
    await this.cleanExpired();
    const restriction = await this.userRestrictionDetailsRaw(restrictionSearch);
    return this.toDto(restriction);
  }

  private toDto(
    restriction?: import('mongoose').Document<
      unknown,
      any,
      ApplicationSocialRestriction
    > &
      Omit<ApplicationSocialRestriction & Required<{ _id: String }>, never>
  ): ApplicationSocialRestrictionDTO | null {
    if (restriction) {
      return {
        userId: restriction.userId,
        restriction: restriction.restriction,
        endless: restriction.endless,
        until: restriction.until.toISOString(),
        note: restriction.note,
      } as ApplicationSocialRestrictionDTO;
    } else {
      return null;
    }
  }

  async isUserRestrictedFrom(
    restrictionSearch: ApplicationSocialRestrictionSearchDTO
  ): Promise<boolean> {
    const now = new Date();
    const restriction = await this.restrictionModel.findOne({
      userId: restrictionSearch.userId,
      restriction: restrictionSearch.restriction,
      $or: [{ endless: true }, { until: { $gte: now } }],
    });

    return !(await this.userRestrictionDetails(restrictionSearch));
  }

  async removeCommentRestriction(
    restrictionRemove: ApplicationSocialRestrictionSearchDTO
  ): Promise<void> {
    await this.restrictionModel.deleteMany({
      userId: { $eq: restrictionRemove.userId },
      restriction: { $eq: restrictionRemove.restriction },
    });
  }
}
