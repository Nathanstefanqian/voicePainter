import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SessionController } from "./session.controller";
import { SessionService } from "./session.service";
import { LLMModule } from "../llm/llm.module";
import {
  DrawingSession,
  DrawingSessionSchema,
} from "./schemas/drawing-session.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DrawingSession.name, schema: DrawingSessionSchema },
    ]),
    LLMModule,
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
