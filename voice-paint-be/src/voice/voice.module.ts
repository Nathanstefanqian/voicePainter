import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MulterModule } from "@nestjs/platform-express";
import { VoiceController } from "./voice.controller";
import { VoiceService } from "./voice.service";
import { VolcSpeechService } from "./services/volc-speech.service";
import { TencentAsrService } from "./services/tencent-asr.service";
import { AsrProviderFactory } from "./services/asr-provider.factory";
import {
  VoiceCommand,
  VoiceCommandSchema,
} from "./schemas/voice-command.schema";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VoiceCommand.name, schema: VoiceCommandSchema },
    ]),
    CommonModule,
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [VoiceController],
  providers: [
    VoiceService,
    VolcSpeechService,
    TencentAsrService,
    AsrProviderFactory,
  ],
  exports: [VoiceService],
})
export class VoiceModule {}
