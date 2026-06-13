import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

@Injectable()
export class TencentAsrService {
  private readonly logger = new Logger(TencentAsrService.name);
  private client: any;

  constructor(private configService: ConfigService) {
    this.initClient();
  }

  private initClient() {
    try {
      const secretId = this.configService.get<string>("tencentCloud.secretId");
      const secretKey = this.configService.get<string>(
        "tencentCloud.secretKey",
      );

      if (!secretId || !secretKey) {
        this.logger.error("腾讯云 ASR 配置缺失");
        return;
      }

      const tencentcloud = require("tencentcloud-sdk-nodejs-asr");
      const AsrClient = tencentcloud.asr.v20190614.Client;

      this.client = new AsrClient({
        credential: { secretId, secretKey },
        region: "ap-shanghai",
        profile: {
          httpProfile: { endpoint: "asr.tencentcloudapi.com" },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to initialize Tencent ASR client: ${(error as Error).message}`,
      );
    }
  }

  async transcribeFromUrl(audioUrl: string): Promise<string> {
    if (!this.client) {
      throw new Error("ASR 服务未就绪");
    }

    let audioBuffer: Buffer;
    try {
      const response = await axios.get(audioUrl, {
        responseType: "arraybuffer",
      });
      audioBuffer = Buffer.from(response.data);
    } catch {
      throw new Error("无法下载音频文件");
    }

    if (!audioBuffer || audioBuffer.length < 100) {
      throw new Error("音频数据无效");
    }

    this.logger.log(
      `[ASR] Starting Tencent ASR, size: ${audioBuffer.length} bytes`,
    );

    const format = audioUrl.toLowerCase().endsWith(".wav")
      ? "wav"
      : audioUrl.toLowerCase().endsWith(".m4a")
        ? "m4a"
        : audioUrl.toLowerCase().endsWith(".mp3")
          ? "mp3"
          : "mp3"; // 默认为 mp3，Tencent ASR 对常见格式有一定兼容性

    const params = {
      EngSerViceType: "16k_zh",
      SourceType: 1,
      VoiceFormat: format,
      Data: audioBuffer.toString("base64"),
      DataLen: audioBuffer.length,
    };

    const data = await this.client.SentenceRecognition(params);
    this.logger.log(`[ASR] Recognition result: ${data.Result}`);
    return data.Result || "";
  }
}
