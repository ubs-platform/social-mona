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
} from 'libs/common/src';
import { EntityOwnershipService } from '@ubs-platform/users-mona-microservice-helper';
import { CommentMapper } from '../mapper/comment.mapper';
import { InjectModel } from '@nestjs/mongoose';
import { lastValueFrom, max } from 'rxjs';
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
    commentModel.votesLength = 0;
    const saved = await commentModel.save();
    this.sendOwnershipForSavedComment(saved, currentUser);
    return this.commentMapper.toDto(saved);
  }

  async searchComments(
    comment: CommentSearchDTO & PaginationRequest,
    currentUser: UserAuthBackendDTO
  ): Promise<PaginationResult> {
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
        },
      },
      {
        $facet: {
          total: [{ $count: 'total' }],
          data: [
            { $sort: { votesLength: -1 } },
            { $skip: comment.size * comment.page },
            // lack of convert to int
            { $limit: parseInt(comment.size as any as string) },
          ],
        },
      },
    ]);

    const maxItemLength = results[0]?.total[0]?.total || 0;
    // return { list, maxItemLength };
    return {
      page: comment.page,
      size: comment.size,
      list: results[0].data.map((a) =>
        this.commentMapper.toDto(a, currentUser)
      ),
      maxItemLength,
    };
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
    console.info(
      commentOEs[0].userCapabilities.find((a) => a.userId == currentUser.id)
    );
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
}
