import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import {
  AsrProviderFactory,
  AsrProviderType,
} from "./services/asr-provider.factory";
import { OssService } from "../common/services/oss.service";
import {
  VoiceCommand,
  VoiceCommandDocument,
} from "./schemas/voice-command.schema";
import { VoiceRecognizeDto, AsrProviderEnum } from "./dto/voice.dto";

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(
    @InjectModel(VoiceCommand.name)
    private voiceCommandModel: Model<VoiceCommandDocument>,
    private asrProviderFactory: AsrProviderFactory,
    private ossService: OssService,
    private configService: ConfigService,
  ) {}

  async recognize(
    userId: string,
    sessionId: string,
    dto: VoiceRecognizeDto,
    file?: Express.Multer.File,
  ) {
    let audioUrl = dto.audioUrl;

    if (!audioUrl && file) {
      audioUrl = await this.ossService.uploadFile(
        file.buffer,
        file.originalname,
        `audio/${sessionId}`,
      );
    }

    if (!audioUrl) {
      throw new BadRequestException("请提供音频文件或音频 URL");
    }

    const provider: AsrProviderType =
      dto.provider === AsrProviderEnum.VOLC ? "volc" : "tencent";
    this.logger.log(`[Voice] Recognizing with provider: ${provider}`);

    let asrText = "";

    try {
      asrText = await this.asrProviderFactory.recognize(audioUrl, provider);

      const command = await this.voiceCommandModel.create({
        commandId: uuidv4(),
        sessionId,
        userId,
        audioUrl,
        asrText,
        intent: "pending",
        params: {},
        status: "success",
      });

      return {
        text: asrText,
        commandId: command.commandId,
        provider,
      };
    } catch (error) {
      this.logger.error(
        `[Voice] Recognition failed: ${(error as Error).message}`,
      );

      await this.voiceCommandModel.create({
        commandId: uuidv4(),
        sessionId,
        userId,
        audioUrl,
        asrText: "",
        intent: "failed",
        params: {},
        status: "failed",
        errorMessage: (error as Error).message,
      });

      throw new BadRequestException(
        `语音识别失败: ${(error as Error).message}`,
      );
    }
  }
}
