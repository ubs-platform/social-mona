export interface CommentAddDTO {
  _id: String;
  entityGroup: String;
  mainEntityName: String;
  mainEntityId: String;
  childEntityName: String;
  childEntityId: String;
  textContent: String;
}

export interface CommentSearchDTO {
  entityGroup: String;
  mainEntityName: String;
  mainEntityId: String;
  childEntityName: String;
  childEntityId: String;
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

  editCount: Number;
}

export interface CommentAbilityDTO {
  userCanComment: boolean;
  userCommentBlockReason: string;
}

export interface CommentEditDTO {
  textContent: String;
}
