import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OSS from "ali-oss";
import { extname } from "path";
import axios from "axios";

@Injectable()
export class OssService {
  private client: any;
  private readonly logger = new Logger(OssService.name);

  constructor(private configService: ConfigService) {
    this.client = new OSS({
      region: this.configService.get<string>("aliyunOss.region") || "",
      accessKeyId:
        this.configService.get<string>("aliyunOss.accessKeyId") || "",
      accessKeySecret:
        this.configService.get<string>("aliyunOss.accessKeySecret") || "",
      bucket: this.configService.get<string>("aliyunOss.bucket") || "",
      secure: true,
      timeout: 3600000,
    });
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    folder: string = "uploads",
  ): Promise<string> {
    try {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join("");
      const extension = extname(originalName) || ".bin";
      const filename = `${folder}/${randomName}${extension}`;

      const result = await this.client.put(filename, fileBuffer);
      const url = result.url;
      this.logger.log(`File uploaded to OSS: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(
        `OSS upload failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  async uploadFromUrl(imageUrl: string, sessionId?: string): Promise<string> {
    try {
      this.logger.log(`Downloading image from: ${imageUrl}`);
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(response.data);

      const extension =
        this.guessExtension(response.headers["content-type"] as string) ||
        ".png";
      const folder = sessionId ? `images/${sessionId}` : "images";
      const filename = `img_${Date.now()}${extension}`;

      return await this.uploadFile(buffer, filename, folder);
    } catch (error) {
      this.logger.error(
        `Failed to upload image from URL: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private guessExtension(contentType: string): string {
    const mimeMap: Record<string, string> = {
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/gif": ".gif",
      "image/webp": ".webp",
    };
    return mimeMap[contentType] || ".png";
  }

  async generatePresignedUrl(
    originalName: string,
    folder: string = "uploads",
    expires: number = 3600,
  ): Promise<{ uploadUrl: string; publicUrl: string }> {
    try {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join("");
      const extension = extname(originalName);
      const filename = `${folder}/${randomName}${extension}`;

      const uploadUrl = await this.client.signatureUrl(filename, {
        expires,
        method: "PUT",
      });

      const bucket = this.configService.get<string>("aliyunOss.bucket");
      const region = this.configService.get<string>("aliyunOss.region");
      const publicUrl = `https://${bucket}.${region}.aliyuncs.com/${filename}`;

      return { uploadUrl, publicUrl };
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
