export class CommentAddDTO {
  _id: String;
  entityGroup: String;
  mainEntityName: String;
  mainEntityId: String;
  childEntityName: String;
  childEntityId: String;
  textContent: String;
}

export class CommentDTO {
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
