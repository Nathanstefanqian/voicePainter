import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

export interface SeedreamParams {
  model?: string;
  prompt: string;
  size?: string;
  aspect_ratio?: string;
  image?: string[];
  watermark?: boolean;
  seed?: number;
  sequential_image_generation?: string;
  output_format?: string;
}

export interface SeedreamResult {
  url: string;
  size: string;
  seed?: number;
}

@Injectable()
export class SeedreamService {
  private readonly logger = new Logger(SeedreamService.name);
  private readonly baseUrl =
    "https://ark.cn-beijing.volces.com/api/v3/images/generations";

  constructor(private configService: ConfigService) {}

  async generateImage(params: SeedreamParams): Promise<SeedreamResult> {
    const apiKey = this.configService.get<string>("volc.arkApiKey");
    const defaultModel =
      this.configService.get<string>("volc.arkModelId") ||
      "doubao-seedream-5-0-260128";

    const size = this.sizeToSeedreamFormat(params.size, params.aspect_ratio);

    const body: any = {
      model: params.model || defaultModel,
      prompt: params.prompt,
      response_format: "url",
      size,
      n: 1,
      watermark: params.watermark ?? true,
    };

    if (params.seed !== undefined) {
      body.seed = params.seed;
    }

    if (params.image && params.image.length > 0) {
      body.image = params.image;
    }

    if (params.sequential_image_generation) {
      body.sequential_image_generation = params.sequential_image_generation;
    }

    if (params.output_format) {
      body.output_format = params.output_format;
    }

    try {
      this.logger.log(`[Seedream] Generating image, size: ${size}`);
      const response = await axios.post(this.baseUrl, body, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.data?.data || response.data.data.length === 0) {
        throw new Error("Seedream API 未返回图片数据");
      }

      const imageData = response.data.data[0];
      return {
        url: imageData.url,
        size: imageData.size || size,
        seed: response.data.seed,
      };
    } catch (error) {
      this.logger.error(`[Seedream] Error: ${(error as Error).message}`);
      throw error;
    }
  }

  private sizeToSeedreamFormat(size?: string, aspectRatio?: string): string {
    if (size === "3K") return "3K";

    const ratioMap: Record<string, string> = {
      "1:1": "2048x2048",
      "16:9": "2560x1440",
      "9:16": "1440x2560",
      "4:3": "2304x1728",
      "3:4": "1728x2304",
    };

    return ratioMap[aspectRatio || "1:1"] || "2048x2048";
  }
}
