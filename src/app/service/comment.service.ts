import {
  Inject,
  Injectable,
  MethodNotAllowedException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { SocialComment } from '../model/comment';
import {
  CAPABILITY_NAME_COMMENT_OWNER,
  CAPABILITY_NAME_ENTITY_OWNER,
  ENTITY_GROUP as SOCIAL_ENTITY_GROUP,
  ENTITY_NAME_COMMENTS as SOCIAL_ENTITY_NAME_COMMENTS,
  KAFKA_CLIENT,
  PAT_INSERT_OWNERSHIP,
} from 'libs/const/constants';
import { ClientKafka } from '@nestjs/microservices';

import {
  EntityOwnershipDTO,
  UserAuthBackendDTO,
} from '@ubs-platform/users-common';
import {
  CanManuplateComment,
  CommentAbilityDTO as CommentingAbilityDTO,
  CommentAddDTO,
  CommentDTO,
  CommentEditDTO,
  CommentSearchDTO,
} from 'libs/common/src';
import { EntityOwnershipService } from '@ubs-platform/users-mona-microservice-helper';
import { CommentMapper } from '../mapper/comment.mapper';
import { InjectModel } from '@nestjs/mongoose';
import { lastValueFrom } from 'rxjs';
@Injectable()
export class CommentService {
  constructor(
    @InjectModel(SocialComment.name) private commentModel: Model<SocialComment>,
    private eoService: EntityOwnershipService,
    private commentMapper: CommentMapper
  ) {}

  private async sendOwnershipForSavedComment(
    saved: import('mongoose').Document<unknown, any, SocialComment> &
      Omit<SocialComment & Required<{ _id: String }>, never>,
    currentUser: UserAuthBackendDTO
  ) {
    const realObject = await lastValueFrom(
      this.eoService.searchOwnership({
        entityGroup: saved.entityGroup,
        entityId: saved.mainEntityId,
        entityName: saved.mainEntityName,
      })
    );
    let realOwner = realObject[0]?.userCapabilities?.find(
      (a) => a.capability == CAPABILITY_NAME_ENTITY_OWNER
    ).userId;

    const realOwnerArr =
      realOwner != null
        ? [
            {
              userId: realOwner,
              capability: CAPABILITY_NAME_ENTITY_OWNER,
            },
          ]
        : [];

    this.eoService.insertOwnership({
      entityGroup: SOCIAL_ENTITY_GROUP,
      entityName: SOCIAL_ENTITY_NAME_COMMENTS,
      entityId: saved._id,
      userCapabilities: [
        {
          userId: currentUser.id,
          capability: CAPABILITY_NAME_COMMENT_OWNER,
        },
        ...realOwnerArr,
      ],
      overriderRoles: [],
    });
  }

  private searchOwnershipForSavedComment(commentId: string) {
    return this.eoService.searchOwnership({
      entityGroup: SOCIAL_ENTITY_GROUP,
      entityName: SOCIAL_ENTITY_NAME_COMMENTS,
      entityId: commentId,
    });
  }

  private fillChildrenWithParentIfEmpty(
    comment: CommentSearchDTO | CommentDTO
  ) {
    if (!comment.childEntityId && !comment.childEntityName) {
      comment.childEntityId = comment.mainEntityId;
      comment.childEntityName = comment.mainEntityName;
    }
  }

  public async insertComment(
    commentDto: CommentAddDTO,
    currentUser: UserAuthBackendDTO
  ) {
    this.fillChildrenWithParentIfEmpty(commentDto);
    const commentModel = new this.commentModel();
    this.commentMapper.moveToEntity(commentModel, commentDto);
    commentModel.byUserId = currentUser.id;
    commentModel.byFullName = currentUser.name + ' ' + currentUser.surname;

    const saved = await commentModel.save();
    this.sendOwnershipForSavedComment(saved, currentUser);
    return this.commentMapper.toDto(saved);
  }

  async searchComments(comment: CommentSearchDTO) {
    this.fillChildrenWithParentIfEmpty(comment);
    const ls = await this.commentModel.find({
      childEntityId: comment.childEntityId,
      childEntityName: comment.childEntityName,
      mainEntityId: comment.mainEntityId,
      mainEntityName: comment.mainEntityName,
      entityGroup: comment.entityGroup,
    });
    return ls.map((a) => this.commentMapper.toDto(a));
  }

  async checkCommentingAbilities(
    comment: CommentSearchDTO,
    currentUser: any
  ): Promise<CommentingAbilityDTO> {
    if (currentUser) {
      return {
        userCanComment: true,
        userCommentBlockReason: '',
      };
    } else {
      return {
        userCanComment: false,
        userCommentBlockReason:
          'mona.comments.userCommentBlockReason.not-logged',
      };
    }
  }

  async deleteComment(commentId: string, currentUser: UserAuthBackendDTO) {
    var { allow, entityOwnership } = await this.checkCanDelete(
      commentId,
      currentUser
    );

    if (allow) {
      await this.commentModel.deleteOne({ _id: commentId });
      await this.eoService.deleteOwnership(entityOwnership);
    } else {
      console.info('izin mizin yok karşim silemezsin amına koyam');
      throw new UnauthorizedException();
    }
  }

  public async checkCanEdit(
    id: string,
    currentUser: any
  ): Promise<CanManuplateComment> {
    let allow = false;
    let entityOwnership: EntityOwnershipDTO;
    const commentOEs = await lastValueFrom(
      this.searchOwnershipForSavedComment(id)
    );
    if (commentOEs.length > 1) {
      console.warn('There is more than one entity ownership');
    }
    if (commentOEs.length > 0) {
      entityOwnership = commentOEs[0];
      allow =
        commentOEs[0].userCapabilities.find(
          (a) =>
            a.userId == currentUser.id &&
            a.capability == CAPABILITY_NAME_COMMENT_OWNER
        ) != null;
    }
    return { allow, entityOwnership };
  }

  public async checkCanDelete(
    commentId: string,
    currentUser: UserAuthBackendDTO
  ): Promise<CanManuplateComment> {
    let entityOwnership: EntityOwnershipDTO;

    let allow = false;
    const commentOEs = await lastValueFrom(
      this.searchOwnershipForSavedComment(commentId)
    );
    if (commentOEs.length > 1) {
      console.warn('There is more than one entity ownership');
    }
    if (commentOEs.length > 0) {
      entityOwnership = commentOEs[0];
      allow =
        commentOEs[0].userCapabilities.find(
          (a) => a.userId == currentUser.id
        ) != null;
    }
    return { entityOwnership, allow };
  }

  async editComment(
    id: string,
    newCommetn: CommentEditDTO,
    currentUser: any
  ): Promise<CommentDTO> {
    var { allow, entityOwnership } = await this.checkCanEdit(id, currentUser);

    if (allow) {
      const comment = await this.commentModel.findById(id);
      comment.textContent = newCommetn.textContent;
      comment.editCount = 1 + comment.editCount;
      comment.lastEditDate = new Date();
      comment.save();
      return this.commentMapper.toDto(comment);
    } else {
      throw new UnauthorizedException();
    }
  }
}
