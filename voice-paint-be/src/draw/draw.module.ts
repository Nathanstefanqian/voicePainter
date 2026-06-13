import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DrawController } from "./draw.controller";
import { DrawService } from "./draw.service";
import { SeedreamService } from "./services/seedream.service";
import {
  GeneratedImage,
  GeneratedImageSchema,
} from "../image/schemas/generated-image.schema";
import {
  DrawingSession,
  DrawingSessionSchema,
} from "../session/schemas/drawing-session.schema";
import { ImageModule } from "../image/image.module";
import { SessionModule } from "../session/session.module";
import { LLMModule } from "../llm/llm.module";
import { CommonModule } from "../common/common.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeneratedImage.name, schema: GeneratedImageSchema },
      { name: DrawingSession.name, schema: DrawingSessionSchema },
    ]),
    ImageModule,
    SessionModule,
    LLMModule,
    CommonModule,
    AuthModule,
  ],
  controllers: [DrawController],
  providers: [DrawService, SeedreamService],
  exports: [DrawService],
})
export class DrawModule {}
