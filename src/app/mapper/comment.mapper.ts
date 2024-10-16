import { Injectable } from '@nestjs/common';
import { CommentAddDTO, CommentDTO } from 'libs/common/src';
import { SocialComment } from '../model/comment';

@Injectable()
export class CommentMapper {
  toDto(comment: SocialComment) {
    return {
      byFullName: comment.byFullName,
      byUserId: comment.byUserId,
      childEntityId: comment.childEntityId,
      childEntityName: comment.childEntityName,
      editCount: comment.editCount,
      lastEditDate: comment.lastEditDate,
      creationDate: comment.creationDate,
      textContent: comment.textContent,
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
  }
}
