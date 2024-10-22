import { Module } from '@nestjs/common';

import { BackendJwtUtilsModule } from '@ubs-platform/users-mona-microservice-helper';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
// import {
//   EmailTemplate,
//   EmailTemplateSchema,
// } from './model/email-template.model';
import { ClientsModule } from '@nestjs/microservices';
import { getMicroserviceConnection } from '@ubs-platform/nest-microservice-setup-util';
import { SocialCommentSchema, SocialComment } from './model/comment';
import { Reaction, ReactionSchema } from './model/reaction';
import { CommentController } from './controller/comment.controller';
import { CommentService } from './service/comment.service';
import { CommentMapper } from './mapper/comment.mapper';
import { UserIntercept } from './guard/UserIntercept';

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
      // { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: SocialComment.name, schema: SocialCommentSchema },
      { name: Reaction.name, schema: ReactionSchema },
    ]),
    ClientsModule.register([
      {
        name: 'KafkaClient',
        ...getMicroserviceConnection(''),
      },
    ]),
  ],
  controllers: [CommentController],
  providers: [CommentService, CommentMapper, UserIntercept],
})
export class AppModule {}
