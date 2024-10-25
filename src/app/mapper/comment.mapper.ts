import { Injectable } from '@nestjs/common';
import { CommentAddDTO, CommentDTO } from 'libs/common/src';
import { SocialComment } from '../model/comment';
import { UserAuthBackendDTO } from '@ubs-platform/users-common';

@Injectable()
export class CommentMapper {
  toDto(comment: SocialComment, currentUser?: UserAuthBackendDTO) {
    return {
      byFullName: comment.byFullName,
      byUserId: comment.byUserId,
      childEntityId: comment.childEntityId,
      childEntityName: comment.childEntityName,
      editCount: comment.editCount,
      lastEditDate: comment.lastEditDate,
      creationDate: comment.creationDate,
      textContent: comment.textContent,
      childOfCommentId: comment.childOfCommentId,
      isChild: comment.isChild,
      _id: comment._id,
      votesLength: comment.votesLength,
      userDownVoted: currentUser != null && comment.downvoteUserIds?.includes(currentUser.id),
      userUpVoted: currentUser != null && comment.upvoteUserIds?.includes(currentUser.id),
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
