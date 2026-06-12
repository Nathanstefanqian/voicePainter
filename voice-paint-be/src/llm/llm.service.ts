import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosError } from "axios";
import { DrawingIntent } from "./tools/drawing-intent.tool";
import {
  INTENT_SYSTEM_PROMPT,
  CURRENT_IMAGE_CONTEXT,
} from "./prompts/intent-recognition";

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly baseUrl = "https://api.siliconflow.cn/v1";

  constructor(private configService: ConfigService) {}

  async recognizeIntent(
    asrText: string,
    currentImageUrl?: string,
    recentContext?: Array<{ role: string; content: string }>,
  ): Promise<DrawingIntent> {
    const apiKey = this.configService.get<string>("siliconFlow.apiKey");
    const model = "deepseek-ai/DeepSeek-V3";

    const imageContext = currentImageUrl
      ? CURRENT_IMAGE_CONTEXT.withImage(currentImageUrl)
      : CURRENT_IMAGE_CONTEXT.withoutImage;

    const messages: any[] = [
      { role: "system", content: INTENT_SYSTEM_PROMPT },
      { role: "system", content: imageContext },
    ];

    // 注入最近的聊天上下文，帮助 LLM 理解指代（如“需要呢”、“就这张”）
    if (recentContext && recentContext.length > 0) {
      recentContext.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    messages.push({ role: "user", content: asrText });

    try {
      const response = await axios.post<{
        choices: Array<{
          message: {
            tool_calls: Array<{
              function: {
                arguments: string;
              };
            }>;
          };
        }>;
      }>(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          max_tokens: 1024,
          temperature: 0.3,
          tools: [
            {
              type: "function",
              function: {
                name: "process_drawing_intent",
                description: "根据用户的语音指令，处理绘图意图并生成执行参数",
                parameters: {
                  type: "object",
                  properties: {
                    action: {
                      type: "string",
                      enum: [
                        "new",
                        "iterate",
                        "adjust",
                        "confirm",
                        "undo",
                        "delete",
                        "select",
                        "chat",
                        "clarify",
                        "unknown",
                      ],
                      description: "绘图动作类型",
                    },
                    prompt: {
                      type: "string",
                      description: "优化后的英文绘图提示词",
                    },
                    index: {
                      type: "number",
                      description: "要打开的图片索引",
                    },
                    size: {
                      type: "string",
                      default: "2K",
                      description: "分辨率：'2K' 或 '3K'",
                    },
                    aspect_ratio: {
                      type: "string",
                      default: "1:1",
                      description: "比例",
                    },
                    reference_images: {
                      type: "array",
                      items: { type: "string" },
                      description: "参考图 URL",
                    },
                    watermark: {
                      type: "boolean",
                      default: false,
                    },
                    confidence: {
                      type: "number",
                      description: "识别置信度（0-1）",
                    },
                    completeness: {
                      type: "number",
                      description: "绘图信息完整度评分（0-1）",
                    },
                    clarify_question: {
                      type: "string",
                      description: "追问文字",
                    },
                    clarify_options: {
                      type: "array",
                      items: { type: "string" },
                      description: "建议选项",
                    },
                    user_feedback: {
                      type: "string",
                      description: "给用户的语音反馈文字",
                    },
                  },
                  required: ["action", "prompt", "confidence", "user_feedback"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "process_drawing_intent" },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const message = response.data.choices?.[0]?.message;
      const toolCall = message?.tool_calls?.[0];

      if (!toolCall) {
        this.logger.warn(
          `[LLM] No tool call returned. Message: ${JSON.stringify(message)}`,
        );
        return this.createUnknownIntent("未识别到有效意图");
      }

      const args = JSON.parse(toolCall.function.arguments) as DrawingIntent;
      this.logger.log(
        `[LLM] Intent recognized: ${args.action}, confidence: ${args.confidence}, completeness: ${args.completeness || 0}`,
      );

      // 只有绘图相关的动作才需要严格检查置信度
      const isDrawingAction = ["new", "iterate", "adjust"].includes(
        args.action,
      );

      if (isDrawingAction && args.confidence < 0.5) {
        return {
          ...args,
          action: "unknown",
          user_feedback: "我没听清楚，请再说一次？",
        };
      }

      // 对于 chat 或 clarify，即使置信度稍低也予以采纳，除非置信度极低（<0.1）
      if (args.confidence < 0.1) {
        return this.createUnknownIntent("未识别到有效意图");
      }

      return args;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `[LLM] API Error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`,
        );
      } else {
        this.logger.error(`[LLM] Error: ${(error as Error).message}`);
      }
      return this.createUnknownIntent("LLM 调用失败");
    }
  }

  async generateTaskSummary(
    asrText: string,
    context?: Array<{ role: string; content: string }>,
  ): Promise<string> {
    const apiKey = this.configService.get<string>("siliconFlow.apiKey");
    const model = "deepseek-ai/DeepSeek-V3";

    try {
      const messages: any[] = [
        {
          role: "system",
          content:
            "你是一个绘画助手。请根据提供的对话历史，提炼出用户想要绘画的主体内容，生成一个极其简短的标题（不超过 6 个字）。\n" +
            "要求：\n" +
            "1. 必须包含绘画的核心主体（如：小男孩、龙、恐龙、城市等）。\n" +
            "2. 严禁生成如“请稍候”、“正在为您”、“好的”等无意义的回复性文字。\n" +
            "3. 示例：\n" +
            "   - 对话：“我想画个穿西装的小猫，要写实的” -> 标题：画只西装小猫\n" +
            "   - 对话：“再来一张恐龙吧，要霸王龙” -> 标题：画只霸王龙\n" +
            "   - 对话：“帮我画个赛博朋克风格的东京街道” -> 标题：赛博朋克东京\n" +
            "直接返回标题，不要有任何标点符号或多余文字。",
        },
      ];

      if (context && context.length > 0) {
        context.forEach((msg) => {
          messages.push({ role: msg.role, content: msg.content });
        });
      } else {
        messages.push({ role: "user", content: asrText });
      }

      const response = await axios.post<{
        choices: Array<{
          message: {
            content: string;
          };
        }>;
      }>(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          max_tokens: 20,
          temperature: 0.5,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const summary = response.data.choices?.[0]?.message?.content?.trim();
      return summary || "绘画任务";
    } catch (error) {
      this.logger.error(
        `[LLM] generateTaskSummary Error: ${(error as Error).message}`,
      );
      return "绘画任务";
    }
  }

  private createUnknownIntent(message: string): DrawingIntent {
    return {
      action: "unknown",
      prompt: "",
      watermark: false,
      confidence: 0,
      user_feedback:
        message ||
        "抱歉，我没听清楚您的要求，您可以试着说“画一只猫”或者“帮我修改一下这张图”。",
    };
  }

  async summarizeChat(
    chatHistory: Array<{ role: string; content: string }>,
  ): Promise<string> {
    const apiKey = this.configService.get<string>("siliconFlow.apiKey");
    // 使用更稳定的通用模型，并确保模型名称正确
    const model = "deepseek-ai/DeepSeek-V3";

    const chatText = chatHistory
      .filter((m) => m.content && m.content.trim().length > 0)
      .map((m) => `${m.role === "user" ? "用户" : "助手"}: ${m.content}`)
      .join("\n");

    if (!chatText) return "对话记录为空";

    const messages = [
      {
        role: "system",
        content:
          "你是一个专业的对话压缩助手。请将绘图过程中的对话压缩成一段简短的摘要（不超过100字），保留核心的绘图意图和最终达成共识的修改点。",
      },
      { role: "user", content: `请压缩以下对话：\n\n${chatText}` },
    ];

    try {
      this.logger.log(
        `[LLM] Summarizing chat with ${chatHistory.length} messages...`,
      );
      const response = await axios.post<{
        choices: Array<{ message: { content: string } }>;
      }>(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          max_tokens: 500, // 适当增加 max_tokens 防止 DeepSeek-V3 生成截断导致 500
          temperature: 0.7,
          top_p: 0.7,
          n: 1,
          stream: false,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000, // 增加超时时间
        },
      );

      const summary = response.data.choices?.[0]?.message?.content;
      if (!summary) {
        throw new Error("Empty response from SiliconFlow");
      }
      return summary.trim();
    } catch (error) {
      const err = error as AxiosError;
      const errorMsg = (err.response?.data as any)?.error?.message || err.message;
      this.logger.error(`[LLM] Summarize Error: ${errorMsg}`);

      // 如果 DeepSeek-V3 繁忙，尝试备选模型
      const status = err.response?.status;
      if (
        status === 500 ||
        status === 503 ||
        status === 429 ||
        err.code === "ECONNABORTED"
      ) {
        this.logger.warn(`[LLM] Retrying with backup model...`);
        return this.summarizeWithBackupModel(messages, apiKey || "");
      }

      return "对话已归档";
    }
  }

  private async summarizeWithBackupModel(
    messages: any[],
    apiKey: string,
  ): Promise<string> {
    const backupModel = "deepseek-ai/DeepSeek-V3"; // 备选模型

    try {
      const response = await axios.post<{
        choices: Array<{ message: { content: string } }>;
      }>(
        `${this.baseUrl}/chat/completions`,
        {
          model: backupModel,
          messages,
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 20000,
        },
      );

      return response.data.choices?.[0]?.message?.content || "对话已归档";
    } catch (e) {
      this.logger.error(`[LLM] Backup Summarize Failed: ${(e as Error).message}`);
      return "对话已归档";
    }
  }
}
