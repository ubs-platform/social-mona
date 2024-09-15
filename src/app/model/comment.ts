import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class SocialComment {
  _id: String;

  @Prop(String)
  entityGroup: String;

  @Prop(String)
  entityName: String;

  @Prop(String)
  entityId: String;

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

  @Prop(String)
  textContent: String;
}

export const CommentSchema = SchemaFactory.createForClass(SocialComment);
