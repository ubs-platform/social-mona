import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class SocialComment {
  _id: String;

  @Prop(String)
  entityGroup: String;

  @Prop(String)
  mainEntityName: String;

  @Prop(String)
  mainEntityId: String;

  @Prop(String)
  childEntityName: String;

  @Prop(String)
  childEntityId: String;

  @Prop(String)
  textContent: String;

  @Prop(String)
  byUserId: String;

  @Prop(String)
  byFullName: String;

  @Prop({ type: Date, default: new Date() })
  creationDate: Date;

  @Prop({ type: Date, default: new Date() })
  lastEditDate: Date;

  @Prop({ type: Number, default: 0 })
  editCount: Number;
}

export const SocialCommentSchema = SchemaFactory.createForClass(SocialComment);
