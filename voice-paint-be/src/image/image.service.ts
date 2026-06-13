import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import {
  GeneratedImage,
  GeneratedImageDocument,
} from "./schemas/generated-image.schema";

@Injectable()
export class ImageService {
  constructor(
    @InjectModel(GeneratedImage.name)
    private imageModel: Model<GeneratedImageDocument>,
  ) {}

  async create(data: Partial<GeneratedImage>): Promise<GeneratedImageDocument> {
    const image = new this.imageModel({
      imageId: uuidv4(),
      ...data,
    });
    return image.save();
  }

  async findByUser(
    userId: string,
    limit = 20,
    skip = 0,
  ): Promise<GeneratedImageDocument[]> {
    return this.imageModel
      .find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async findById(imageId: string): Promise<GeneratedImageDocument | null> {
    return this.imageModel.findOne({ imageId, isDeleted: false }).exec();
  }

  async softDelete(imageId: string): Promise<void> {
    await this.imageModel.updateOne({ imageId }, { isDeleted: true }).exec();
  }

  async deleteByUrl(userId: string, imageUrl: string): Promise<void> {
    const pureUrl = imageUrl.split("?")[0];
    await this.imageModel
      .updateOne(
        {
          userId,
          $or: [
            { imageUrl },
            { imageUrlOss: imageUrl },
            { imageUrl: pureUrl },
            { imageUrlOss: pureUrl },
          ],
        },
        { isDeleted: true },
      )
      .exec();
  }

  async getImageHistory(
    userId: string,
    sessionId?: string,
  ): Promise<GeneratedImageDocument[]> {
    const query: any = { userId, isDeleted: false };
    if (sessionId) {
      query.sessionId = sessionId;
    }
    return this.imageModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findLatestBySession(sessionId: string): Promise<GeneratedImageDocument | null> {
    return this.imageModel
      .findOne({ sessionId, isDeleted: false })
      .sort({ createdAt: -1 })
      .exec();
  }
}
