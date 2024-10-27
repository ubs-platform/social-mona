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
  PaginationRequest,
  PaginationResult,
  CommentAbilityDTO,
} from 'libs/common/src';
import { EntityOwnershipService } from '@ubs-platform/users-mona-microservice-helper';
import { CommentMapper } from '../mapper/comment.mapper';
import { InjectModel } from '@nestjs/mongoose';
import { lastValueFrom, max } from 'rxjs';
import { SocialCommentMeta } from '../model/comment-meta';
@Injectable()
export class CommentService {
  constructor(
    @InjectModel(SocialComment.name) private commentModel: Model<SocialComment>,
    @InjectModel(SocialCommentMeta.name)
    private commentMetaModel: Model<SocialCommentMeta>,
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
    const status = await this.checkCommentingAbilities(commentDto, currentUser);
    if (!status.userCanComment) {
      throw new UnauthorizedException(
        'commenting-not-allowed',
        status.userCommentBlockReason
      );
    }
    let commentMeta = await this.findOrCreateNewMeta(commentDto);
    this.fillChildrenWithParentIfEmpty(commentDto);
    const commentModel = new this.commentModel();
    this.commentMapper.moveToEntity(commentModel, commentDto);
    commentModel.byUserId = currentUser.id;
    commentModel.byFullName = currentUser.name + ' ' + currentUser.surname;
    commentModel.votesLength = 0;
    const saved = await commentModel.save();
    commentMeta.length += 1;
    commentMeta.save();
    if (commentDto.childOfCommentId) {
      const parent = await this.commentModel.findById(
        commentDto.childOfCommentId
      );
      parent.childCommentsCount = !parent.childCommentsCount
        ? 1
        : parent.childCommentsCount + 1;
      parent.save();
    }
    this.sendOwnershipForSavedComment(saved, currentUser);
    return this.commentMapper.toDto(saved);
  }

  private async findOrCreateNewMeta(commentDto: CommentSearchDTO) {
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

  async searchComments(
    comment: CommentSearchDTO & PaginationRequest,
    currentUser: UserAuthBackendDTO
  ): Promise<PaginationResult> {
    const sortingRotation = comment.sortRotation == 'ASC' ? 1 : -1;
    const sortingField =
      comment.sortField == 'CREATIONDATE'
        ? {
            creationDate: sortingRotation,
            _id: sortingRotation,
          }
        : { votesLength: sortingRotation, _id: sortingRotation };

    this.fillChildrenWithParentIfEmpty(comment);
    // const ls = await this.commentModel.find({
    //   childEntityId: comment.childEntityId,
    //   childEntityName: comment.childEntityName,
    //   mainEntityId: comment.mainEntityId,
    //   mainEntityName: comment.mainEntityName,
    //   entityGroup: comment.entityGroup,
    // });
    const results = await this.commentModel.aggregate([
      {
        $match: {
          childEntityId: comment.childEntityId,
          childEntityName: comment.childEntityName,
          mainEntityId: comment.mainEntityId,
          mainEntityName: comment.mainEntityName,
          entityGroup: comment.entityGroup,
          ...(comment.childOfCommentId
            ? { childOfCommentId: comment.childOfCommentId, isChild: true }
            : { isChild: { $ne: true } }),
        },
      },
      {
        $facet: {
          total: [{ $count: 'total' }],
          //@ts-ignore
          data: [
            { $sort: sortingField },
            { $skip: comment.size * comment.page },
            // lack of convert to int
            { $limit: parseInt(comment.size as any as string) },
          ].filter((a) => a),
        },
      },
    ]);

    const maxItemLength = results[0]?.total[0]?.total || 0;
    // return { list, maxItemLength };
    return await this.commentsPaginatedToDto(
      comment,
      results,
      currentUser,
      maxItemLength
    );
  }

  private async commentsPaginatedToDto(
    comment: CommentSearchDTO & PaginationRequest,
    results: any[],
    currentUser: UserAuthBackendDTO,
    maxItemLength: any
  ): Promise<PaginationResult> {
    const commentDtos: Array<CommentDTO> = [];
    for (let index = 0; index < results[0].data.length; index++) {
      const comment = results[0].data[index];
      commentDtos.push({
        ...(await this.commentMapper.toDto(comment, currentUser)),
      });
    }

    return {
      page: comment.page,
      size: comment.size,
      list: commentDtos,
      maxItemLength,
    };
  }

  async checkCommentingAbilities(
    comment: CommentSearchDTO,
    currentUser: UserAuthBackendDTO
  ): Promise<CommentingAbilityDTO> {
    if (currentUser) {
      const ac = await this.findOrCreateNewMeta(comment);
      if (ac.commentingDisabledUserIds.includes(currentUser.id)) {
        return {
          userCanComment: false,
          userCommentBlockReason:
            'mona.comments.userCommentBlockReason.disabled',
        };
      } else {
        return {
          userCanComment: true,
          userCommentBlockReason: '',
        };
      }
    } else {
      return {
        userCanComment: false,
        userCommentBlockReason:
          'mona.comments.userCommentBlockReason.not-logged',
      };
    }
  }

  async deleteComment(commentId: string, currentUser: UserAuthBackendDTO) {
    var { allow, entityOwnership } = await this.commentMapper.checkCanDelete(
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

  async editComment(
    id: string,
    newCommetn: CommentEditDTO,
    currentUser: any
  ): Promise<CommentDTO> {
    var { allow, entityOwnership } = await this.commentMapper.checkCanEdit(
      id,
      currentUser
    );

    if (allow) {
      const comment = await this.commentModel.findById(id);
      comment.textContent = newCommetn.textContent;
      comment.editCount = 1 + comment.editCount;
      comment.lastEditDate = new Date();
      comment.save();
      return this.commentMapper.toDto(comment, currentUser);
    } else {
      throw new UnauthorizedException();
    }
  }

  async voteComment(
    id: string,
    currentUser: UserAuthBackendDTO,
    u: 'UP' | 'DOWN'
  ): Promise<CommentDTO> {
    const ac = await this.commentModel.findById(id);

    const upvoteIndex = ac.upvoteUserIds.indexOf(currentUser.id);
    const downvoteIndex = ac.downvoteUserIds.indexOf(currentUser.id);
    if (!ac.votesLength || Number.isNaN(ac.votesLength)) {
      ac.votesLength = 0;
    }
    if (upvoteIndex > -1) {
      ac.upvoteUserIds.splice(upvoteIndex, 1);
      ac.votesLength = ac.votesLength - 1;
    }
    if (downvoteIndex > -1) {
      ac.downvoteUserIds.splice(downvoteIndex, 1);
      ac.votesLength = ac.votesLength + 1;
    }
    if (u == 'DOWN' && downvoteIndex == -1) {
      ac.downvoteUserIds.push(currentUser.id);
      ac.votesLength = ac.votesLength - 1;
    } else if (u == 'UP' && upvoteIndex == -1) {
      ac.upvoteUserIds.push(currentUser.id);
      ac.votesLength = ac.votesLength + 1;
    }
    ac.save();

    return this.commentMapper.toDto(ac, currentUser);
  }

  async commentCount(comment: CommentSearchDTO) {
    // const meta = await this.findOrCreateNewMeta(comment);
    // return meta.length
    const commentCount = await this.commentModel.aggregate([
      {
        $match: {
          childEntityId: comment.childEntityId,
          childEntityName: comment.childEntityName,
          mainEntityId: comment.mainEntityId,
          mainEntityName: comment.mainEntityName,
          entityGroup: comment.entityGroup,
        },
      },
      {
        $count: 'total',
      },
    ]);
    return commentCount?.[0]?.total || 0;
  }
}
