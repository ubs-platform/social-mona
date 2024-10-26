import {
  EntityOwnershipDTO,
  UserAuthBackendDTO,
} from '@ubs-platform/users-common';

export interface CommentAddDTO {
  _id?: String;
  entityGroup: String;
  mainEntityName: String;
  mainEntityId: String;
  childEntityName: String;
  childEntityId: String;
  textContent: String;
  childOfCommentId?: string;
}

export interface CommentSearchDTO {
  entityGroup: String;
  mainEntityName: String;
  mainEntityId: String;
  childEntityName: String;
  childEntityId: String;
  childOfCommentId?: string;
}

export interface CommentDTO {
  _id: String;

  entityGroup: String;

  mainEntityName: String;

  mainEntityId: String;

  childEntityName: String;

  childEntityId: String;

  textContent: String;

  byUserId: String;

  byFullName: String;

  creationDate: Date;

  lastEditDate: Date;

  editCount: number;

  isChild?: boolean;

  childOfCommentId?: string;

  userDownVoted: boolean;

  userUpVoted: boolean;

  votesLength: number;

  childCommentsCount: number;
}

export interface CommentAbilityDTO {
  userCanComment: boolean;
  userCommentBlockReason: string;
}

export interface CommentEditDTO {
  textContent: String;
}

export class ExistCommentAbilityDTO {
  canRemove: boolean;
  canEdit: boolean;
}

export interface CanManuplateComment {
  entityOwnership: EntityOwnershipDTO;
  allow: boolean;
}

export type SORT_FIELD = 'VOTE' | 'CREATIONDATE';
export type SORT_ROTATION = 'ASC' | 'DESC';

export interface PaginationRequest {
  page: number;
  size: number;
  sortField: SORT_FIELD;
  sortRotation: SORT_ROTATION;
}

export interface PaginationResult {
  page: number;
  size: number;
  maxItemLength: number;
  list: CommentDTO[];
}
