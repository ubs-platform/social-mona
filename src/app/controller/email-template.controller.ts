import { Controller } from '@nestjs/common';
import { BaseCrudControllerGenerator } from './base/base-crud.controller';
import { EmailTemplate } from '../model/email-template.model';
import { EmailTemplateDTO } from '../dto/email-template.dto';
import { EmailTemplateService } from '../service/email-template.service';
import { EmailTemplateSearch } from '../dto/email-template.search';

const config = {
  authorization: { ALL: { needsAuthenticated: true, roles: ['ADMIN'] } },
};
@Controller('email-template')
export class EmailTemplateController extends BaseCrudControllerGenerator<
  EmailTemplate,
  EmailTemplateDTO,
  EmailTemplateDTO,
  EmailTemplateSearch
>(config) {
  constructor(service: EmailTemplateService) {
    super(service);
  }
}
