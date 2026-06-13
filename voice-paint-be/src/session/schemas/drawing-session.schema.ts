import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type DrawingSessionDocument = Document & DrawingSession;

@Schema({ timestamps: true })
export class DrawingSession {
  @Prop({ required: true, unique: true })
  sessionId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ default: "active", enum: ["active", "completed"] })
  status!: string;

  @Prop({ type: String })
  currentImageId?: string;

  @Prop({ type: [String], default: [] })
  imageHistory!: string[];

  @Prop({ type: Array, default: [] })
  chatHistory!: Array<{
    role: "user" | "assistant";
    content: string;
    type: "text" | "image";
    imageUrl?: string;
    createdAt: Date;
    isArchived?: boolean;
    archiveGroup?: string;
  }>;

  @Prop({ default: 0 })
  turnCount!: number;

  @Prop({ type: Object, default: {} })
  metadata!: {
    language?: string;
    device?: string;
  };

  @Prop({ type: Object, default: {} })
  draftContext!: {
    originalPrompt?: string;
    accumulatedPrompt?: string;
    collectedParams?: Record<string, any>;
    turnCount?: number;
    completeness?: number;
  };
}

export const DrawingSessionSchema =
  SchemaFactory.createForClass(DrawingSession);
