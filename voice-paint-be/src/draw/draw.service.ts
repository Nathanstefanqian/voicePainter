import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ImageService } from "../image/image.service";
import { SessionService } from "../session/session.service";
import { LLMService } from "../llm/llm.service";
import { SeedreamService } from "./services/seedream.service";
import { OssService } from "../common/services/oss.service";
import { DrawingIntent } from "../llm/tools/drawing-intent.tool";
import { AuthService } from "../auth/auth.service";
import {
  GeneratedImage,
  GeneratedImageDocument,
} from "../image/schemas/generated-image.schema";

@Injectable()
export class DrawService {
  private readonly logger = new Logger(DrawService.name);

  constructor(
    private imageService: ImageService,
    private sessionService: SessionService,
    private llmService: LLMService,
    private seedreamService: SeedreamService,
    private ossService: OssService,
    private authService: AuthService,
    @InjectModel(GeneratedImage.name)
    private imageModel: Model<GeneratedImageDocument>,
  ) {}

  async recognizeIntent(
    userId: string,
    asrText: string,
    currentImageUrl?: string,
  ): Promise<DrawingIntent> {
    try {
      // 增加硬编码关键词检测，确保删除指令不被误判为闲聊
      const deleteKeywords = [
        "删除",
        "删掉",
        "移除",
        "不要",
        "删了",
        "去掉",
        "清理",
        "这张不要了",
        "这张删了",
        "这张删掉",
        "不需要了",
        "不想要了",
      ];
      const trimmedText = asrText.trim().replace(/[，。！？,.!?]/g, "");

      if (deleteKeywords.some((kw) => trimmedText.includes(kw))) {
        this.logger.log(
          `[DrawService] Hardcoded delete intent detected: "${asrText}" (trimmed: "${trimmedText}")`,
        );
        return {
          action: "delete",
          prompt: "",
          confidence: 1.0,
          completeness: 0,
          user_feedback: "好的，已为您删除当前图片。",
          watermark: false,
        } as DrawingIntent;
      }

      const session =
        await this.sessionService.getOrCreateCurrentSession(userId);

      // 只加载未归档的对话作为上下文
      const recentContext = session.chatHistory
        ? session.chatHistory
            .filter((msg) => !msg.isArchived)
            .slice(-10)
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            }))
        : [];

      const intent = await this.llmService.recognizeIntent(
        asrText,
        currentImageUrl,
        recentContext,
      );

      return intent;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `[DrawService] recognizeIntent Error: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  async processDrawing(
    userId: string,
    asrText: string,
    currentImageUrl?: string,
    providedIntent?: DrawingIntent,
  ) {
    try {
      const session =
        await this.sessionService.getOrCreateCurrentSession(userId);
      const user = await this.authService.getUserModelById(userId);

      // 获取当前进度
      const currentDraft = session.draftContext || {
        turnCount: 0,
        completeness: 0,
      };

      const intent =
        providedIntent ||
        (await this.recognizeIntent(userId, asrText, currentImageUrl));

      this.logger.log(
        `[DrawService] Intent action recognized: ${intent.action}, user input: "${asrText}"`,
      );

      const isNewDrawing = intent.action === "new";
      const isModification = ["iterate", "adjust"].includes(intent.action);
      const isForceDraw =
        asrText.includes("直接画") ||
        asrText.includes("直接出图") ||
        asrText.includes("不用问了") ||
        asrText.includes("随便画");

      const initialTurnCount = currentDraft.turnCount || 0;

      // 只有全新的绘图任务且非强制出图，才走 5 轮引导流程
      // 或者当前已经在引导流程中（initialTurnCount > 0），且 LLM 返回了 new 或 clarify
      const isContinuingGuidance =
        initialTurnCount > 0 &&
        (intent.action === "new" || intent.action === "clarify");

      if ((isNewDrawing && !isForceDraw) || isContinuingGuidance) {
        // 严格程序控制：只要是对话在继续，且没有强制出图，就增加进度
        currentDraft.turnCount = initialTurnCount + 1;
        // 核心逻辑：按程序累加收集度，每轮 20%，且保证不回退
        const newCompleteness = Math.min(currentDraft.turnCount * 0.2, 1.0);
        currentDraft.completeness = Math.max(
          currentDraft.completeness || 0,
          newCompleteness,
        );
        intent.completeness = currentDraft.completeness;

        // 强制规则：至少追问 5 轮
        if (currentDraft.turnCount < 5) {
          this.logger.log(
            `[DrawService] Forcing clarify (turn ${currentDraft.turnCount}/5, completeness: ${currentDraft.completeness})`,
          );
          intent.action = "clarify";

          // 如果大模型没有给出追问问题，后端进行差异化兜底
          if (!intent.clarify_question) {
            if (currentDraft.turnCount === 1) {
              intent.clarify_question =
                "为了画出更好的效果，您希望这张图是什么画风的？";
              intent.clarify_options = [
                "写实风格",
                "动漫风格",
                "赛博朋克",
                "唯美油画",
              ];
            } else if (currentDraft.turnCount === 2) {
              intent.clarify_question = "明白了，那您对画面的构图比例有要求吗？";
              intent.clarify_options = [
                "1:1 正方形",
                "16:9 宽屏",
                "9:16 竖屏",
                "4:3 比例",
              ];
            } else if (currentDraft.turnCount === 3) {
              intent.clarify_question = "好的，画面中需要加入什么样的光影氛围呢？";
              intent.clarify_options = [
                "温暖阳光",
                "神秘月光",
                "霓虹灯光",
                "自然柔光",
              ];
            } else if (currentDraft.turnCount === 4) {
              intent.clarify_question =
                "最后，您对主体角色的穿着或细节有什么补充吗？";
              intent.clarify_options = [
                "日常休闲",
                "华丽古风",
                "科幻机甲",
                "简约时尚",
              ];
            } else {
              intent.clarify_question =
                "为了达到完美的效果，我们再确认最后一个细节：您对背景环境有什么具体要求吗？";
              intent.clarify_options = [
                "室内场景",
                "户外自然",
                "城市街道",
                "科幻背景",
              ];
            }
          }
        } else {
          // 达到 5 轮，重置计数器
          this.logger.log(
            `[DrawService] Target turns reached, releasing to draw`,
          );
          currentDraft.turnCount = 0;
          currentDraft.completeness = 0;
          intent.action = "new";
          intent.completeness = 1.0;
        }

        await this.sessionService.updateDraftContext(
          session.sessionId,
          currentDraft,
        );
      } else if (isModification || isForceDraw) {
        // 如果是修改（iterate/adjust）或强制出图，直接重置计数并执行
        this.logger.log(
          `[DrawService] Modification or ForceDraw detected, skipping guidance`,
        );
        currentDraft.turnCount = 0;
        currentDraft.completeness = 0;
        intent.completeness = 1.0;
        await this.sessionService.updateDraftContext(
          session.sessionId,
          currentDraft,
        );
      } else if (intent.action === "clarify" && initialTurnCount === 0) {
          // 特殊情况：大模型直接返回了 clarify，且是任务起始点
          this.logger.log(`[DrawService] LLM returned clarify at turn 0`);

          /* 暂时取消归档和总结机制
          // 获取即将被归档的历史消息作为总结上下文，只保留最近几条关键对话
          const archiveContext = session.chatHistory
            ? session.chatHistory
                .filter((msg) => !msg.isArchived)
                .slice(-6) // 取最近 6 条即可，避免过长干扰
                .map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                }))
            : [];

          const summaryTitle = await this.llmService.generateTaskSummary(
            asrText,
            archiveContext,
          );
          const groupName = `${summaryTitle} ${requestStartTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
          await this.sessionService.archiveOldChat(
            session.sessionId,
            groupName,
            requestStartTime,
          );
          */
          currentDraft.turnCount = 1;
        currentDraft.completeness = 0.2;
        intent.completeness = 0.2;
        await this.sessionService.updateDraftContext(
          session.sessionId,
          currentDraft,
        );
      }

      this.logger.log(`[DrawService] Final action: ${intent.action}`);

      if (intent.action === "confirm") {
        return {
          action: "confirm",
          message: "图片已确认保存，您可以在历史记录中查看",
          imageUrl: currentImageUrl,
        };
      }

      if (intent.action === "undo") {
        const history = await this.imageService.getImageHistory(
          userId,
          session.sessionId,
        );
        let message = "没有可以撤销的图片";
        let imageUrl = currentImageUrl;

        if (history.length > 1) {
          const previousImage = history[1];
          imageUrl = previousImage.imageUrlOss || previousImage.imageUrl;
          message = "已回到上一张图片";

          await this.sessionService.addChatToHistory(session.sessionId, [
            {
              role: "user",
              content: asrText,
              type: "text",
              createdAt: new Date(),
            },
            {
              role: "assistant",
              content: message,
              type: "text",
              createdAt: new Date(),
            },
          ]);

          return {
            action: "undo",
            imageUrl,
            message,
          };
        }

        return {
          action: "undo",
          message,
        };
      }

      if (intent.action === "delete") {
        let message = "当前没有可以删除的图片";
        if (currentImageUrl) {
          // 移除 URL 中的 query 参数，增加匹配成功率
          const pureUrl = currentImageUrl.split("?")[0];

          const img = await this.imageModel
            .findOne({
              userId,
              $or: [
                { imageUrl: currentImageUrl },
                { imageUrlOss: currentImageUrl },
                { imageUrl: pureUrl },
                { imageUrlOss: pureUrl },
              ],
              isDeleted: false,
            })
            .exec();

          if (img) {
            await this.imageService.deleteByUrl(userId, currentImageUrl);
            message = "图片已删除";

            await this.sessionService.addChatToHistory(session.sessionId, [
              {
                role: "user",
                content: asrText,
                type: "text",
                createdAt: new Date(),
              },
              {
                role: "assistant",
                content: message,
                type: "text",
                createdAt: new Date(),
              },
            ]);

            return {
              action: "delete",
              message,
              imageUrl: currentImageUrl,
              imageId: img.imageId,
            };
          }
        }

        // 即使删除失败，也记录对话，让用户知道发生了什么
        await this.sessionService.addChatToHistory(session.sessionId, [
          {
            role: "user",
            content: asrText,
            type: "text",
            createdAt: new Date(),
          },
          {
            role: "assistant",
            content: message,
            type: "text",
            createdAt: new Date(),
          },
        ]);

        return {
          action: "delete",
          message,
        };
      }

      if (intent.action === "select") {
        const history = await this.imageService.getImageHistory(userId);
        const index = intent.index || 0;

        let message = "目前画廊中没有照片哦，需要我帮你创作一张吗？";
        if (index > 0) {
          message = `画廊中没有第 ${index + 1} 张照片哦，需要我帮你创作一张吗？`;
        }

        let imageUrl = currentImageUrl;

        if (history && history.length > index) {
          const selectedImage = history[index];
          imageUrl = selectedImage.imageUrlOss || selectedImage.imageUrl;
          message =
            index === 0
              ? "好的，已为您打开画廊中最新的照片。"
              : `好的，已为您打开画廊中的第 ${index + 1} 张照片。`;

          await this.sessionService.addChatToHistory(session.sessionId, [
            {
              role: "user",
              content: asrText,
              type: "text",
              createdAt: new Date(),
            },
            {
              role: "assistant",
              content: message,
              type: "text",
              createdAt: new Date(),
            },
          ]);

          return {
            action: "select",
            imageUrl,
            message,
            imageId: selectedImage.imageId,
          };
        }

        await this.sessionService.addChatToHistory(session.sessionId, [
          {
            role: "user",
            content: asrText,
            type: "text",
            createdAt: new Date(),
          },
          {
            role: "assistant",
            content: message,
            type: "text",
            createdAt: new Date(),
          },
        ]);

        return {
          action: "select",
          message,
        };
      }

      if (intent.action === "exit_voice_mode") {
        return {
          action: "exit_voice_mode",
          message: "已为您关闭全语音模式",
        };
      }

      if (intent.action === "unknown") {
        return {
          action: "unknown",
          message: intent.user_feedback,
        };
      }

      if (intent.action === "visual_chat") {
        this.logger.log(`[DrawService] Processing visual chat for user: ${userId}`);

        // 确保有图片可以看
        if (!currentImageUrl) {
          return {
            action: "chat",
            message: "抱歉，我现在还没看到图片，没法为您评价。您可以先画一张图，或者传一张图给我看。",
            imageUrl: currentImageUrl,
          };
        }

        const recentContext = session.chatHistory
          ? session.chatHistory
              .filter((msg) => !msg.isArchived)
              .slice(-10)
              .map((msg) => ({
                role: msg.role,
                content: msg.content,
              }))
          : [];

        const visionResponse = await this.llmService.visionChat(
          asrText,
          currentImageUrl,
          recentContext,
        );

        // 更新聊天历史
        await this.sessionService.addChatToHistory(session.sessionId, [
          {
            role: "user",
            content: asrText,
            type: "text",
            createdAt: new Date(),
          },
          {
            role: "assistant",
            content: visionResponse,
            type: "text",
            createdAt: new Date(),
          },
        ]);

        return {
          action: "visual_chat",
          message: visionResponse,
          imageUrl: currentImageUrl,
          prompt: "",
        };
      }

      if ((intent.action as string) === "unknown") {
        this.logger.log(`[DrawService] Unknown intent, falling back to chat`);
        intent.action = "chat";
      }

      if (intent.action === "chat") {
        await this.sessionService.addChatToHistory(session.sessionId, [
          {
            role: "user",
            content: asrText,
            type: "text",
            createdAt: new Date(),
          },
          {
            role: "assistant",
            content: intent.user_feedback,
            type: "text",
            createdAt: new Date(),
          },
        ]);
        return {
          action: "chat",
          message: intent.user_feedback,
          imageUrl: currentImageUrl, // 保持当前图片不消失
          prompt: "",
        };
      }

      if (intent.action === "clarify") {
        // 如果用户在上一轮已经选择了“直接出图”，或者这一轮指令包含强行绘图意图，则覆盖 clarify
        if (
          asrText.includes("直接画") ||
          asrText.includes("直接出图") ||
          asrText.includes("不用问了")
        ) {
          intent.action = "new";
          this.logger.log(`[DrawService] Clarify overridden by user command`);
        } else {
          // 保存追问状态
          await this.sessionService.addChatToHistory(session.sessionId, [
            {
              role: "user",
              content: asrText,
              type: "text",
              createdAt: new Date(),
            },
            {
              role: "assistant",
              content: intent.clarify_question || intent.user_feedback,
              type: "text",
              createdAt: new Date(),
            },
          ]);

          return {
            action: "clarify",
            message: intent.clarify_question,
            options: intent.clarify_options,
            completeness: intent.completeness,
            imageUrl: currentImageUrl,
          };
        }
      }

      const seedreamParams = this.buildSeedreamParams(
        intent,
        currentImageUrl,
        user?.settings?.preferredModel,
      );
      
      this.logger.log(
        `[DrawService] Calling Seedream with params: ${JSON.stringify({ ...seedreamParams, prompt: seedreamParams.prompt.substring(0, 20) + "..." })}`,
      );
      
      const rawResult = await this.seedreamService.generateImage(seedreamParams);

      const ossUrl = await this.ossService.uploadFromUrl(
        rawResult.url,
        session.sessionId,
      );

      const latestImage = await this.imageService.findLatestBySession(
        session.sessionId,
      );
      const parentImageId =
        intent.action !== "new" ? latestImage?.imageId : undefined;

      // Generate summary title (6-10 words)
      const summaryTitle = await this.llmService.summarizeImageTitle(intent.prompt);

      const savedImage = await this.imageService.create({
        sessionId: session.sessionId,
        userId,
        promptCn: summaryTitle, // Use summarized title as Chinese prompt/title
        promptEn: intent.prompt,
        imageUrl: rawResult.url,
        imageUrlOss: ossUrl,
        model: seedreamParams.model || "doubao-seedream-5-0-260128",
        size: rawResult.size,
        aspectRatio: intent.aspect_ratio || "1:1",
        seed: rawResult.seed,
        action: intent.action,
        parentImageId,
        asrResult: {
          text: asrText,
          confidence: intent.confidence,
          language: "zh",
        },
        llmResult: {
          action: intent.action,
          prompt: intent.prompt,
          size: intent.size || "2K",
          confidence: intent.confidence,
        },
      });

      await this.sessionService.addImageToHistory(
        session.sessionId,
        savedImage.imageId,
        {
          role: "user",
          content: asrText,
          type: "text",
          createdAt: new Date(),
        },
        {
          role: "assistant",
          content: intent.user_feedback,
          type: "image",
          imageUrl: ossUrl,
          createdAt: new Date(),
        },
      );

      return {
        action: intent.action,
        imageId: savedImage.imageId,
        imageUrl: ossUrl,
        prompt: intent.prompt,
        message: intent.user_feedback,
        parentImageId: savedImage.parentImageId,
      };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `[DrawService] processDrawing Error: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  private buildSeedreamParams(
    intent: DrawingIntent,
    currentImageUrl?: string,
    preferredModel?: string,
  ) {
    // 只有在 action 是 iterate 或 adjust 时，才默认使用当前图作为参考图
    let referenceImages: string[] | undefined = intent.reference_images;

    if (
      !referenceImages &&
      (intent.action === "iterate" || intent.action === "adjust") &&
      currentImageUrl
    ) {
      referenceImages = [currentImageUrl];
    }

    // 如果是 new 动作，明确清空参考图
    if (intent.action === "new") {
      referenceImages = undefined;
    }

    return {
      model: preferredModel || "doubao-seedream-5-0-260128",
      prompt: intent.prompt,
      size: intent.size || "2K",
      aspect_ratio: intent.aspect_ratio || "1:1",
      image: referenceImages,
      watermark: intent.watermark ?? false, // 默认关闭水印
    };
  }

  async getHistory(userId: string, sessionId?: string) {
    return this.imageService.getImageHistory(userId, sessionId);
  }

  async getImage(userId: string, imageId: string) {
    const image = await this.imageService.findById(imageId);
    if (!image) {
      throw new BadRequestException("图片不存在");
    }
    if (image.userId !== userId) {
      throw new BadRequestException("无权访问该图片");
    }
    return image;
  }

  async deleteImage(userId: string, imageId: string) {
    const image = await this.imageService.findById(imageId);
    if (!image) {
      throw new BadRequestException("图片不存在");
    }
    if (image.userId !== userId) {
      throw new BadRequestException("无权删除该图片");
    }
    await this.imageService.softDelete(imageId);
    return { message: "图片已删除" };
  }

  async batchDeleteImages(userId: string, imageIds: string[]) {
    this.logger.log(`[DrawService] Batch deleting ${imageIds.length} images for user ${userId}`);
    for (const imageId of imageIds) {
      try {
        const image = await this.imageService.findById(imageId);
        if (image && image.userId === userId) {
          await this.imageService.softDelete(imageId);
        }
      } catch (err) {
        this.logger.error(`[DrawService] Failed to delete image ${imageId}: ${(err as Error).message}`);
      }
    }
    return { message: `已成功删除 ${imageIds.length} 张图片记录` };
  }
}
