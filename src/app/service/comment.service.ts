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
import {
  CommentDTO,
  EntityOwnershipDTO,
  UserCapability,
} from 'libs/common/src/index';
import { UserAuthBackendDTO } from '@ubs-platform/users-common';
@Injectable()
export class CommentService {
  constructor(
    @Inject(Comment.name) private commentModel: Model<SocialComment>,
    @Inject(KAFKA_CLIENT) private kafkaClient: ClientKafka
  ) {}

  public async insertComment(
    commentDto: CommentDTO,
    currentUser: UserAuthBackendDTO
  ) {
    const commentModel = new this.commentModel();
    commentModel.textContent = commentDto.textContent;
    commentModel.entityName = commentDto.entityName;
    commentModel.entityId = commentDto.entityId;
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
    this.sendOwnership({
      entityGroup: ENTITY_GROUP,
      entityName: ENTITY_NAME,
      entityId: saved._id,
      parent: {
        entityGroup: commentDto.entityGroup,
        entityName: commentDto.entityName,
        entityId: commentDto.entityId,
      },
      fileUploadMaxLengthBytes: '0',
      fileUploadAllowedFormats: [],
      userCapabilities: [
        {
          userId: currentUser.id,
          capability: CAPABILITY_NAME_COMMENTER,
        },
      ],
      overriderRoles: [],
    });
  }

  private sendOwnership(ownershipDto: EntityOwnershipDTO) {
    this.kafkaClient.send(PAT_INSERT_OWNERSHIP, ownershipDto);
  }
}
