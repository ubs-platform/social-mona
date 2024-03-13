import { Injectable } from '@nestjs/common';
import { EmailTemplate } from '../model/email-template.model';
import { EmailTemplateDTO } from '../dto/email-template.dto';
import { BaseCrudServiceGenerate } from './base/base-crud.service';
import { EmailTemplateSearch } from '../dto/email-template.search';
import { FilterQuery } from 'mongoose';

@Injectable()
export class EmailTemplateService extends BaseCrudServiceGenerate<
  EmailTemplate,
  EmailTemplateDTO,
  EmailTemplateDTO,
  EmailTemplateSearch
>(EmailTemplate.name) {
  searchParams(s: EmailTemplateSearch): FilterQuery<EmailTemplate> {
    const searchQueries: FilterQuery<EmailTemplate> = {};
    if (s) {
      if (s.htmlContentContains != null) {
        searchQueries.htmlContent = {
          // like search
          $regex: '.*' + s.htmlContentContains + '.*',
        };
      }
    }

    return searchQueries;
  }
  toOutput(m?: EmailTemplate): EmailTemplateDTO | Promise<EmailTemplateDTO> {
    return { htmlContent: m.htmlContent, _id: m._id };
  }
  moveIntoModel(
    model: EmailTemplate,
    i: EmailTemplateDTO
  ): EmailTemplate | Promise<EmailTemplate> {
    model.htmlContent = i.htmlContent;
    return model;
  }
}
