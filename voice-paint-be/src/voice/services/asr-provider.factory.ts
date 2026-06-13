import { Injectable } from "@nestjs/common";
import { VolcSpeechService } from "./volc-speech.service";
import { TencentAsrService } from "./tencent-asr.service";

export type AsrProviderType = "volc" | "tencent";

@Injectable()
export class AsrProviderFactory {
  constructor(
    private volcSpeechService: VolcSpeechService,
    private tencentAsrService: TencentAsrService,
  ) {}

  async recognize(fileUrl: string, provider: AsrProviderType): Promise<string> {
    switch (provider) {
      case "tencent":
        return this.tencentAsrService.transcribeFromUrl(fileUrl);
      case "volc":
      default:
        return this.recognizeWithVolc(fileUrl);
    }
  }

  private async recognizeWithVolc(fileUrl: string): Promise<string> {
    const taskId = await this.volcSpeechService.submitTask(fileUrl);

    const maxAttempts = 20;
    const interval = 1500;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      const result = await this.volcSpeechService.queryResult(taskId);

      if (result.status === "completed" && result.data) {
        const text = result.data.map((u: any) => u.text).join(" ");
        return text;
      }

      if (result.status === "failed") {
        throw new Error(result.message || "火山引擎 ASR 识别失败");
      }

      attempts++;
    }

    throw new Error("火山引擎 ASR 识别超时");
  }
}
