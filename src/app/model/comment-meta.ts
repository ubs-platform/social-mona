import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class SocialCommentMeta {
  _id: String;

  @Prop(String)
  entityGroup: string;

  @Prop(String)
  mainEntityName: string;

  @Prop(String)
  mainEntityId: string;

  @Prop(String)
  commentingStatus: 'ALLOW' | 'ARCHIVE';

  @Prop([String])
  commentingDisabledUserIds: string[];

  @Prop(Number)
  length: number;
}

export const SocialCommentMetaSchema =
  SchemaFactory.createForClass(SocialCommentMeta);
