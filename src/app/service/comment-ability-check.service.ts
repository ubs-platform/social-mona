import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { SocialComment } from '../model/comment';
import {
  CAPABILITY_NAME_COMMENT_OWNER,
  CAPABILITY_NAME_ENTITY_OWNER,
  ENTITY_GROUP as SOCIAL_ENTITY_GROUP,
  ENTITY_NAME_COMMENTS as SOCIAL_ENTITY_NAME_COMMENTS,
} from 'libs/const/constants';

import {
  EntityOwnershipDTO,
  UserAuthBackendDTO,
} from '@ubs-platform/users-common';
import {
  CanManuplateComment,
  CommentAbilityDTO as CommentingAbilityDTO,
  CommentSearchDTO,
} from 'libs/common/src';
import { EntityOwnershipService } from '@ubs-platform/users-mona-microservice-helper';
import { CommentMapper } from '../mapper/comment.mapper';
import { InjectModel } from '@nestjs/mongoose';
import { lastValueFrom } from 'rxjs';
import { SocialCommentMeta } from '../model/comment-meta';
import { CommentMetaService } from './comment-meta.service';
@Injectable()
export class CommentAbilityCheckService {
  constructor(
    @InjectModel(SocialCommentMeta.name)
    private commentMetaModel: Model<SocialCommentMeta>,
    @InjectModel(SocialComment.name) private commentModel: Model<SocialComment>,
    // @InjectModel(SocialCommentMeta.name)
    // private commentMetaModel: Model<SocialCommentMeta>,
    private eoService: EntityOwnershipService,
    private commentMetaService: CommentMetaService
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

  public async checkCanEdit(
    id: String,
    currentUser: any
  ): Promise<CanManuplateComment> {
    if (currentUser != null) {
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
    } else {
      return { allow: false, entityOwnership: null };
    }
  }

  public searchOwnershipForSavedComment(commentId: string | String) {
    return this.eoService.searchOwnership({
      entityGroup: SOCIAL_ENTITY_GROUP,
      entityName: SOCIAL_ENTITY_NAME_COMMENTS,
      entityId: commentId,
    });
  }

  public async checkCanDelete(
    socialComment: SocialComment,
    currentUser: UserAuthBackendDTO
  ): Promise<CanManuplateComment> {
    if (currentUser != null) {
      let entityOwnership: EntityOwnershipDTO;

      let allow = socialComment.byUserId == currentUser.id;

      const commentOEs = await lastValueFrom(
        this.searchOwnershipForSavedComment(socialComment._id)
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
      } else {
        const e = await this.isUserOwnerOfRealEntity(
          socialComment,
          currentUser
        );
        allow = e != null;
      }

      return { entityOwnership, allow };
    } else {
      return { allow: false, entityOwnership: null };
    }
  }

  public async sendOwnershipForSavedComment(
    saved: import('mongoose').Document<unknown, any, SocialComment> &
      Omit<SocialComment & Required<{ _id: String }>, never>,
    currentUser: UserAuthBackendDTO
  ) {
    const realObject = await this.realEntityOwnership(saved);
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

  public async realEntityOwnership(saved: SocialComment) {
    return await lastValueFrom(
      this.eoService.searchOwnership({
        entityGroup: saved.entityGroup,
        entityId: saved.mainEntityId,
        entityName: saved.mainEntityName,
      })
    );
  }

  public async isUserOwnerOfRealEntity(
    saved: SocialComment,
    user: UserAuthBackendDTO
  ) {
    if (user) {
      return await lastValueFrom(
        this.eoService.hasOwnership({
          entityGroup: saved.entityGroup,
          entityId: saved.mainEntityId,
          entityName: saved.mainEntityName,
          userId: user.id,
          capability: 'OWNER',
        })
      );
    } else {
      return null;
    }
  }

  async checkCommentingAbilities(
    comment: CommentSearchDTO,
    currentUser: UserAuthBackendDTO
  ): Promise<CommentingAbilityDTO> {
    if (currentUser) {
      const ac = await this.commentMetaService.findOrCreateNewMeta(comment);
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
}
