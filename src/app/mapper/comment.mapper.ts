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
import { CommentAbilityCheckService } from '../service/comment-ability-check.service';

@Injectable()
export class CommentMapper {
  /**
   *
   */
  constructor(private commentAbilityService: CommentAbilityCheckService) {}

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
      canEdit: (
        await this.commentAbilityService.checkCanEdit(comment._id, currentUser)
      ).allow,
      canRemove: (
        await this.commentAbilityService.checkCanDelete(comment, currentUser)
      ).allow,
      userCommentAdmin:
        (await this.commentAbilityService.isUserOwnerOfRealEntity(
          comment,
          currentUser
        )) != null,
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
}
