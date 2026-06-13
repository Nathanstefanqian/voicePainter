import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { DrawService } from "./draw.service";
import { GenerateImageDto, GetImageHistoryDto } from "./dto/draw.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("draw")
@UseGuards(JwtAuthGuard)
export class DrawController {
  constructor(private drawService: DrawService) {}

  @Post("intent")
  async recognizeIntent(
    @CurrentUser("sub") userId: string,
    @Body() dto: GenerateImageDto,
  ) {
    return this.drawService.recognizeIntent(
      userId,
      dto.prompt,
      dto.currentImageUrl,
    );
  }

  @Post("generate")
  async generate(
    @CurrentUser("sub") userId: string,
    @Body() dto: GenerateImageDto,
  ) {
    return this.drawService.processDrawing(
      userId,
      dto.prompt,
      dto.currentImageUrl,
      dto.intent,
    );
  }

  @Get("history")
  async getHistory(
    @CurrentUser("sub") userId: string,
    @Query() query: GetImageHistoryDto,
  ) {
    return this.drawService.getHistory(userId, query.sessionId);
  }

  @Get(":imageId")
  async getImage(
    @CurrentUser("sub") userId: string,
    @Param("imageId") imageId: string,
  ) {
    return this.drawService.getImage(userId, imageId);
  }

  @Delete(":imageId")
  async deleteImage(
    @CurrentUser("sub") userId: string,
    @Param("imageId") imageId: string,
  ) {
    return this.drawService.deleteImage(userId, imageId);
  }
}
