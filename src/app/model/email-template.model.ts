import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class EmailTemplate {
  _id: String;

  @Prop()
  htmlContent: String;
}

export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);
