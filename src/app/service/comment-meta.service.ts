import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { CommentSearchDTO } from 'libs/common/src';
import { InjectModel } from '@nestjs/mongoose';
import { SocialCommentMeta } from '../model/comment-meta';
@Injectable()
export class CommentMetaService {
  constructor(
    @InjectModel(SocialCommentMeta.name)
    private commentMetaModel: Model<SocialCommentMeta>
  ) {}

  public async findOrCreateNewMeta(commentDto: CommentSearchDTO) {
    let commentMeta = await this.commentMetaModel.findOne({
      entityGroup: commentDto.entityGroup,
      mainEntityId: commentDto.mainEntityId,
      mainEntityName: commentDto.mainEntityName,
    });
    if (commentMeta == null) {
      commentMeta = new this.commentMetaModel({
        entityGroup: commentDto.entityGroup,
        mainEntityId: commentDto.mainEntityId,
        mainEntityName: commentDto.mainEntityName,
        commentingStatus: 'ALLOW',
        bannedUsers: [],
        length: 0,
      });

      await commentMeta.save();
    }
    return commentMeta;
  }
}
