import {
  Controller,
  Post,
  Body,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { VoiceService } from "./voice.service";
import { VoiceRecognizeDto } from "./dto/voice.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("voice")
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(private voiceService: VoiceService) {}

  @Post("recognize")
  @UseInterceptors(FileInterceptor("audio"))
  async recognize(
    @CurrentUser("sub") userId: string,
    @Body() dto: VoiceRecognizeDto,
    @UploadedFile() file: Express.Multer.File,
    @Query("sessionId") sessionId: string,
  ) {
    return this.voiceService.recognize(
      userId,
      sessionId || "default",
      dto,
      file,
    );
  }
}
