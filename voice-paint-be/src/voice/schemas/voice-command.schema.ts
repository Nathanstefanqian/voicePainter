import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type VoiceCommandDocument = Document & VoiceCommand;

@Schema({ timestamps: true })
export class VoiceCommand {
  @Prop({ required: true, unique: true })
  commandId!: string;

  @Prop({ required: true })
  sessionId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  audioUrl!: string;

  @Prop({ default: "" })
  asrText!: string;

  @Prop({ required: true })
  intent!: string;

  @Prop({ type: Object, default: {} })
  params!: Record<string, unknown>;

  @Prop({ default: "success", enum: ["success", "failed", "retry"] })
  status!: string;

  @Prop()
  errorMessage?: string;
}

export const VoiceCommandSchema = SchemaFactory.createForClass(VoiceCommand);
