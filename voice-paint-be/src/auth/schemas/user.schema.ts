import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import * as bcrypt from "bcrypt";

export interface UserDocument extends Document {
  userId: string;
  username: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  profile: {
    avatarUrl?: string;
    bio?: string;
  };
  settings: {
    preferredModel?: string;
  };
  usageStats: {
    totalImages: number;
    totalTokens: number;
    dailyImageCount: number;
    lastResetAt: Date;
  };
  comparePassword(password: string): Promise<boolean>;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  userId!: string;

  @Prop({ required: true, unique: true, minlength: 3, maxlength: 30 })
  username!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ default: "user", enum: ["user", "admin"] })
  role!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ type: Object, default: {} })
  profile!: {
    avatarUrl?: string;
    bio?: string;
  };

  @Prop({ type: Object, default: {} })
  settings!: {
    preferredModel?: string;
  };

  @Prop({ type: Object, default: {} })
  usageStats!: {
    totalImages: number;
    totalTokens: number;
    dailyImageCount: number;
    lastResetAt: Date;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret: any) => {
    delete ret.password;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};
