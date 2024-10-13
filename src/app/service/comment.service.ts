import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { SocialComment } from '../model/comment';
import {
  CAPABILITY_NAME_COMMENTER,
  ENTITY_GROUP,
  ENTITY_NAME,
  KAFKA_CLIENT,
  PAT_INSERT_OWNERSHIP,
} from 'libs/const/constants';
import { ClientKafka } from '@nestjs/microservices';

import { UserAuthBackendDTO } from '@ubs-platform/users-common';
import { CommentDTO } from 'libs/common/src';
import { EntityOwnershipService } from '@ubs-platform/users-mona-microservice-helper';
@Injectable()
export class CommentService {
  constructor(
    @Inject(SocialComment.name) private commentModel: Model<SocialComment>,
    private eoService: EntityOwnershipService
  ) {}

  public async insertComment(
    commentDto: CommentDTO,
    currentUser: UserAuthBackendDTO
  ) {
    const commentModel = new this.commentModel();
    commentModel.textContent = commentDto.textContent;
    commentModel.mainEntityName = commentDto.mainEntityName;
    commentModel.mainEntityId = commentDto.mainEntityId;
    commentModel.childEntityName = commentDto.childEntityName;
    commentModel.childEntityId = commentDto.childEntityId;
    commentModel.entityGroup = commentDto.entityGroup;
    const saved = await commentModel.save();
    this.sendOwnershipForSavedComment(saved, commentDto, currentUser);
  }

  private sendOwnershipForSavedComment(
    saved: import('mongoose').Document<unknown, any, SocialComment> &
      Omit<SocialComment & Required<{ _id: String }>, never>,
    commentDto: CommentDTO,
    currentUser: UserAuthBackendDTO
  ) {
    this.eoService.insertOwnership({
      entityGroup: ENTITY_GROUP,
      entityName: ENTITY_NAME,
      entityId: saved._id,
      userCapabilities: [
        {
          userId: currentUser.id,
          capability: CAPABILITY_NAME_COMMENTER,
        },
      ],
      overriderRoles: [],
    });
  }
}
