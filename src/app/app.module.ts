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
import { ClientsModule } from '@nestjs/microservices';
import { getMicroserviceConnection } from '@ubs-platform/nest-microservice-setup-util';

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
    ClientsModule.register([
      {
        name: 'KafkaClient',
        ...getMicroserviceConnection(''),
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
