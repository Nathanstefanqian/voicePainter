import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ImageService } from "./image.service";
import {
  GeneratedImage,
  GeneratedImageSchema,
} from "./schemas/generated-image.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeneratedImage.name, schema: GeneratedImageSchema },
    ]),
  ],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
