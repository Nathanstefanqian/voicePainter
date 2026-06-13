import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class VolcSpeechService {
  private readonly logger = new Logger(VolcSpeechService.name);
  private readonly submitUrl =
    "https://openspeech.bytedance.com/api/v3/auc/bigmodel/submit";
  private readonly queryUrl =
    "https://openspeech.bytedance.com/api/v3/auc/bigmodel/query";

  constructor(private configService: ConfigService) {}

  async submitTask(fileUrl: string): Promise<string> {
    const appId = this.configService.get<string>("volc.appId") || "";
    const token = this.configService.get<string>("volc.accessToken") || "";
    const requestId = uuidv4();

    const headers = {
      "X-Api-App-Key": appId,
      "X-Api-Access-Key": token,
      "X-Api-Resource-Id": "volc.seedasr.auc",
      "X-Api-Request-Id": requestId,
      "X-Api-Sequence": "-1",
      "Content-Type": "application/json",
    };

    const body = {
      user: { uid: requestId },
      audio: {
        url: fileUrl,
        format: fileUrl.toLowerCase().endsWith(".wav")
          ? "wav"
          : fileUrl.toLowerCase().endsWith(".m4a")
            ? "m4a"
            : "mp3",
      },
      request: {
        model_name: "seed-asr",
        enable_speaker_info: true,
        ssd_version: "200",
        enable_itn: true,
        enable_punc: true,
        enable_ddc: true,
      },
    };

    try {
      this.logger.log(`[VolcSpeech] Submitting task, requestId: ${requestId}`);
      const response = await axios.post(this.submitUrl, body, {
        headers,
        timeout: 0,
      });
      const statusCode = response.headers["x-api-status-code"];
      const apiMessage = response.headers["x-api-message"];

      if (statusCode === "20000000") {
        this.logger.log(
          `[VolcSpeech] Task submitted successfully, taskId: ${requestId}`,
        );
        return requestId;
      } else {
        throw new Error(`火山引擎 ASR 提交失败: ${apiMessage}`);
      }
    } catch (error) {
      this.logger.error(
        `[VolcSpeech] Submit task error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async queryResult(
    taskId: string,
  ): Promise<{ status: string; data?: any[]; message?: string }> {
    const appId = this.configService.get<string>("volc.appId") || "";
    const token = this.configService.get<string>("volc.accessToken") || "";

    const headers = {
      "X-Api-App-Key": appId,
      "X-Api-Access-Key": token,
      "X-Api-Resource-Id": "volc.seedasr.auc",
      "X-Api-Request-Id": taskId,
      "X-Api-Sequence": "-1",
      "Content-Type": "application/json",
    };

    try {
      const response = await axios.post(
        this.queryUrl,
        {},
        { headers, timeout: 0 },
      );
      const statusCode = response.headers["x-api-status-code"];
      const apiMessage = response.headers["x-api-message"];

      if (statusCode === "20000000") {
        const utterances = response.data?.result?.utterances || [];
        return { status: "completed", data: utterances };
      } else if (statusCode === "20000001") {
        return { status: "processing" };
      } else {
        return { status: "failed", message: apiMessage || "识别任务失败" };
      }
    } catch (error) {
      this.logger.error(
        `[VolcSpeech] Query task error: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
