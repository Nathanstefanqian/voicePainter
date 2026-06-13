import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type RefreshTokenDocument = Document & RefreshToken;

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ required: true, unique: true })
  tokenId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  refreshToken!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: "valid", enum: ["valid", "revoked"] })
  status!: string;

  @Prop({ type: Date })
  revokedAt?: Date;

  @Prop()
  userAgent?: string;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
