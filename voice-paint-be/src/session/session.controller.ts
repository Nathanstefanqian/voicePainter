import { Controller, Get, Post, Delete, UseGuards } from "@nestjs/common";
import { SessionService } from "./session.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { LLMService } from "../llm/llm.service";

@Controller("session")
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(
    private sessionService: SessionService,
    private llmService: LLMService,
  ) {}

  @Get("current")
  async getCurrent(@CurrentUser("sub") userId: string) {
    return this.sessionService.getOrCreateCurrentSession(userId);
  }

  @Post("new")
  async createNewSession(@CurrentUser("sub") userId: string) {
    return this.sessionService.create(userId);
  }

  @Get("history")
  async getSessionHistory(@CurrentUser("sub") userId: string) {
    return this.sessionService.findByUser(userId);
  }

  @Delete("chat")
  async clearChat(@CurrentUser("sub") userId: string) {
    const session = await this.sessionService.getOrCreateCurrentSession(userId);
    await this.sessionService.clearChatHistory(session.sessionId);
    return { message: "对话已清空" };
  }

  @Post("chat/compress")
  async compressChat(@CurrentUser("sub") userId: string) {
    const session = await this.sessionService.getOrCreateCurrentSession(userId);
    if (!session.chatHistory || session.chatHistory.length === 0) {
      return { message: "没有可压缩的对话" };
    }

    const summary = await this.llmService.summarizeChat(session.chatHistory);

    const newHistory = [
      {
        role: "assistant" as const,
        content: `📦 对话摘要：${summary}`,
        type: "text" as const,
        createdAt: new Date(),
      },
    ];

    await this.sessionService.updateChatHistory(session.sessionId, newHistory);
    return { message: "对话已压缩", summary };
  }
}
