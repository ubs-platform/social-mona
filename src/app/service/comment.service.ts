import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { SocialComment } from '../model/comment';
import {
  CAPABILITY_NAME_OWNER,
  ENTITY_GROUP,
  ENTITY_NAME_COMMENTS,
  KAFKA_CLIENT,
  PAT_INSERT_OWNERSHIP,
} from 'libs/const/constants';
import { ClientKafka } from '@nestjs/microservices';

import { UserAuthBackendDTO } from '@ubs-platform/users-common';
import { CommentAddDTO, CommentDTO, CommentSearchDTO } from 'libs/common/src';
import { EntityOwnershipService } from '@ubs-platform/users-mona-microservice-helper';
import { CommentMapper } from '../mapper/comment.mapper';
import { InjectModel } from '@nestjs/mongoose';
@Injectable()
export class CommentService {
  constructor(
    @InjectModel(SocialComment.name) private commentModel: Model<SocialComment>,
    private eoService: EntityOwnershipService,
    private commentMapper: CommentMapper
  ) {}

  public async insertComment(
    commentDto: CommentAddDTO,
    currentUser: UserAuthBackendDTO
  ) {
    this.fillChildsWithParentIfEmpty(commentDto);
    const commentModel = new this.commentModel();
    this.commentMapper.moveToEntity(commentModel, commentDto);
    commentModel.byUserId = currentUser.id;
    commentModel.byFullName = currentUser.name + ' ' + currentUser.surname;

    const saved = await commentModel.save();
    this.sendOwnershipForSavedComment(saved, currentUser);
    return this.commentMapper.toDto(saved);
  }

  async searchComments(comment: CommentSearchDTO) {
    this.fillChildsWithParentIfEmpty(comment);
    const ls = await this.commentModel.find({
      childEntityId: comment.childEntityId,
      childEntityName: comment.childEntityName,
      mainEntityId: comment.mainEntityId,
      mainEntityName: comment.mainEntityName,
      entityGroup: comment.entityGroup,
    });
    return ls.map((a) => this.commentMapper.toDto(a));
  }

  private fillChildsWithParentIfEmpty(comment: CommentSearchDTO | CommentDTO) {
    if (!comment.childEntityId && !comment.childEntityName) {
      comment.childEntityId = comment.mainEntityId;
      comment.childEntityName = comment.mainEntityName;
    }
  }

  private sendOwnershipForSavedComment(
    saved: import('mongoose').Document<unknown, any, SocialComment> &
      Omit<SocialComment & Required<{ _id: String }>, never>,
    currentUser: UserAuthBackendDTO
  ) {
    this.eoService.insertOwnership({
      entityGroup: ENTITY_GROUP,
      entityName: ENTITY_NAME_COMMENTS,
      entityId: saved._id,
      userCapabilities: [
        {
          userId: currentUser.id,
          capability: CAPABILITY_NAME_OWNER,
        },
      ],
      overriderRoles: [],
    });
  }
}
