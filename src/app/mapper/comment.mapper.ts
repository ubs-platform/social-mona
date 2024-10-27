import { Injectable } from '@nestjs/common';
import {
  CanManuplateComment,
  CommentAddDTO,
  CommentDTO,
} from 'libs/common/src';
import { SocialComment } from '../model/comment';
import {
  EntityOwnershipDTO,
  UserAuthBackendDTO,
} from '@ubs-platform/users-common';
import {
  CAPABILITY_NAME_COMMENT_OWNER,
  CAPABILITY_NAME_ENTITY_OWNER,
  ENTITY_GROUP as SOCIAL_ENTITY_GROUP,
  ENTITY_NAME_COMMENTS as SOCIAL_ENTITY_NAME_COMMENTS,
  KAFKA_CLIENT,
  PAT_INSERT_OWNERSHIP,
} from 'libs/const/constants';
import { lastValueFrom } from 'rxjs';
import { EntityOwnershipService } from '@ubs-platform/users-mona-microservice-helper';

@Injectable()
export class CommentMapper {
  /**
   *
   */
  constructor(private eoService: EntityOwnershipService) {}
  async toDto(comment: SocialComment, currentUser?: UserAuthBackendDTO) {
    return {
      byFullName: comment.byFullName,
      byUserId: comment.byUserId,
      childEntityId: comment.childEntityId,
      childEntityName: comment.childEntityName,
      mainEntityId: comment.mainEntityId,
      mainEntityName: comment.mainEntityName,
      entityGroup: comment.entityGroup,
      editCount: comment.editCount,
      lastEditDate: comment.lastEditDate,
      creationDate: comment.creationDate,
      textContent: comment.textContent,
      childOfCommentId: comment.childOfCommentId,
      isChild: comment.isChild,
      childCommentsCount: comment.childCommentsCount,
      _id: comment._id,
      votesLength: comment.votesLength,
      canEdit: (await this.checkCanEdit(comment._id, currentUser)).allow,
      canRemove: (await this.checkCanDelete(comment._id, currentUser)).allow,
      userDownVoted:
        currentUser != null &&
        comment.downvoteUserIds?.includes(currentUser.id),
      userUpVoted:
        currentUser != null && comment.upvoteUserIds?.includes(currentUser.id),
    } as CommentDTO;
  }

  moveToEntity(
    commentModel: import('mongoose').Document<unknown, any, SocialComment> &
      Omit<SocialComment & Required<{ _id: String }>, never>,
    commentDto: CommentAddDTO
  ) {
    commentModel.textContent = commentDto.textContent;
    commentModel.mainEntityName = commentDto.mainEntityName;
    commentModel.mainEntityId = commentDto.mainEntityId;
    commentModel.childEntityName = commentDto.childEntityName;
    commentModel.childEntityId = commentDto.childEntityId;
    commentModel.entityGroup = commentDto.entityGroup;
    commentModel.childOfCommentId = commentDto.childOfCommentId;
    commentModel.isChild = commentDto.childOfCommentId?.trim() ? true : false;
  }

  public async checkCanEdit(
    id: string | String,
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

  private searchOwnershipForSavedComment(commentId: string | String) {
    return this.eoService.searchOwnership({
      entityGroup: SOCIAL_ENTITY_GROUP,
      entityName: SOCIAL_ENTITY_NAME_COMMENTS,
      entityId: commentId,
    });
  }

  public async checkCanDelete(
    commentId: string | String,
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
}
