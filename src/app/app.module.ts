import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackendJwtUtilsModule } from '@ubs-platform/users-mona-microservice-helper';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmailTemplate,
  EmailTemplateSchema,
} from './model/email-template.model';
import { EmailTemplateController } from './controller/email-template.controller';
import { EmailTemplateService } from './service/email-template.service';

@Module({
  imports: [
    BackendJwtUtilsModule,
    MongooseModule.forRoot(
      `mongodb://${process.env.NX_MONGO_USERNAME}:${
        process.env.NX_MONGO_PASSWORD
      }@${process.env.NX_MONGO_URL || 'localhost'}/?authMechanism=DEFAULT`,
      {
        dbName: process.env.NX_MONGO_DBNAME || 'ubs_users',
      }
    ),
    MongooseModule.forFeature([
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
    ]),
  ],
  controllers: [AppController, EmailTemplateController],
  providers: [AppService, EmailTemplateService],
})
export class AppModule {}
