import { z } from "zod";

export const DrawingIntentSchema = z.object({
  action: z
    .enum([
      "new",
      "iterate",
      "adjust",
      "confirm",
      "undo",
      "delete",
      "select",
      "exit_voice_mode",
      "chat",
      "clarify",
      "unknown",
    ])
    .describe("绘图动作类型"),
  prompt: z.string().describe("优化后的英文绘图提示词"),
  size: z.string().optional().describe("分辨率：'2K' 或 '3K'"),
  aspect_ratio: z
    .string()
    .optional()
    .describe("比例：'1:1', '16:9', '9:16', '4:3', '3:4'"),
  reference_images: z
    .array(z.string())
    .optional()
    .describe("参考图 URL（action=iterate/adjust 时传入）"),
  watermark: z.boolean().optional().default(true),
  confidence: z.number().min(0).max(1).describe("识别置信度，<0.5 应重试"),
  completeness: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe(
      "绘图信息完整度评分（0-1），仅在 action 为 new/iterate/adjust 时有意义",
    ),
  index: z
    .number()
    .optional()
    .describe("当 action=select 时，用户想要打开的图片索引（0 表示最新一张，1 表示第二张，以此类推）"),
  clarify_question: z
    .string()
    .optional()
    .describe("当 action=clarify 时的追问文字"),
  clarify_options: z
    .array(z.string())
    .optional()
    .describe("当 action=clarify 时的建议选项（选择题）"),
  user_feedback: z.string().describe("给用户的语音反馈文字"),
});

export type DrawingIntent = z.infer<typeof DrawingIntentSchema>;
