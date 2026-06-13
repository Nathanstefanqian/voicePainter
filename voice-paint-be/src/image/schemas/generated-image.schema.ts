import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type GeneratedImageDocument = Document & GeneratedImage;

@Schema({ timestamps: true })
export class GeneratedImage {
  @Prop({ required: true, unique: true })
  imageId!: string;

  @Prop({ required: true })
  sessionId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  promptCn!: string;

  @Prop({ required: true })
  promptEn!: string;

  @Prop({ required: true })
  imageUrl!: string;

  @Prop()
  imageUrlOss?: string;

  @Prop({ required: true })
  model!: string;

  @Prop({ default: "2K" })
  size!: string;

  @Prop({ default: "1:1" })
  aspectRatio!: string;

  @Prop({ type: Number })
  seed?: number;

  @Prop({ required: true })
  action!: string;

  @Prop()
  parentImageId?: string;

  @Prop({ type: Object, default: {} })
  asrResult!: {
    text: string;
    confidence: number;
    language: string;
  };

  @Prop({ type: Object, default: {} })
  llmResult!: {
    action: string;
    prompt: string;
    size: string;
    confidence: number;
  };

  @Prop({ type: Number, default: 0 })
  cost!: number;

  @Prop({ default: false })
  isDeleted!: boolean;
}

export const GeneratedImageSchema =
  SchemaFactory.createForClass(GeneratedImage);
