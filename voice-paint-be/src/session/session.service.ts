import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import {
  DrawingSession,
  DrawingSessionDocument,
} from "./schemas/drawing-session.schema";

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(DrawingSession.name)
    private sessionModel: Model<DrawingSessionDocument>,
  ) {}

  async create(userId: string): Promise<DrawingSessionDocument> {
    const session = new this.sessionModel({
      sessionId: uuidv4(),
      userId,
      status: "active",
      turnCount: 0,
      imageHistory: [],
      chatHistory: [],
      metadata: {},
      draftContext: { turnCount: 0 },
    });
    return session.save();
  }

  async findByUser(userId: string): Promise<DrawingSessionDocument[]> {
    return this.sessionModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findById(sessionId: string): Promise<DrawingSessionDocument | null> {
    return this.sessionModel.findOne({ sessionId }).exec();
  }

  async getOrCreateCurrentSession(
    userId: string,
  ): Promise<DrawingSessionDocument> {
    const session = await this.sessionModel
      .findOne({ userId, status: "active" })
      .sort({ createdAt: -1 })
      .exec();

    if (session) {
      return session;
    }

    return this.create(userId);
  }

  async addImageToHistory(
    sessionId: string,
    imageId: string,
    ...messages: Array<{
      role: "user" | "assistant";
      content: string;
      type: "text" | "image";
      imageUrl?: string;
      createdAt: Date;
    }>
  ): Promise<void> {
    await this.sessionModel
      .updateOne(
        { sessionId },
        {
          $push: {
            imageHistory: imageId,
            chatHistory: { $each: messages },
          },
          $inc: { turnCount: 1 },
          $set: { currentImageId: imageId },
        },
      )
      .exec();
  }

  async complete(sessionId: string): Promise<void> {
    await this.sessionModel
      .updateOne({ sessionId }, { status: "completed" })
      .exec();
  }

  async clearChatHistory(sessionId: string): Promise<void> {
    await this.sessionModel
      .updateOne({ sessionId }, { $set: { chatHistory: [] } })
      .exec();
  }

  async updateChatHistory(
    sessionId: string,
    history: DrawingSession["chatHistory"],
  ): Promise<void> {
    await this.sessionModel
      .updateOne({ sessionId }, { $set: { chatHistory: history } })
      .exec();
  }

  async addChatToHistory(
    sessionId: string,
    messages: Array<{
      role: "user" | "assistant";
      content: string;
      type: "text" | "image";
      imageUrl?: string;
      createdAt: Date;
      isArchived?: boolean;
      archiveGroup?: string;
    }>,
  ): Promise<void> {
    await this.sessionModel
      .updateOne({ sessionId }, { $push: { chatHistory: { $each: messages } } })
      .exec();
  }

  async updateDraftContext(
    sessionId: string,
    draftContext: DrawingSession["draftContext"],
  ): Promise<void> {
    await this.sessionModel
      .updateOne({ sessionId }, { $set: { draftContext } })
      .exec();
  }

  async archiveOldChat(
    sessionId: string,
    groupName: string,
    before?: Date,
  ): Promise<void> {
    const session = await this.sessionModel.findOne({ sessionId }).exec();
    if (!session) return;

    const archiveBefore = before || new Date();
    const updatedHistory = session.chatHistory.map((msg) => {
      // 只有在指定时间之前的消息才会被归档
      // 这样可以确保当前正在处理的消息（即使因为某种原因提前进入了数据库）不会被归档
      if (!msg.isArchived && new Date(msg.createdAt) < archiveBefore) {
        return { ...msg, isArchived: true, archiveGroup: groupName };
      }
      return msg;
    });

    await this.sessionModel
      .updateOne({ sessionId }, { $set: { chatHistory: updatedHistory } })
      .exec();
  }
}
