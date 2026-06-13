import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import configuration from "./config/configuration";
import { AuthModule } from "./auth/auth.module";
import { CommonModule } from "./common/common.module";
import { VoiceModule } from "./voice/voice.module";
import { LLMModule } from "./llm/llm.module";
import { DrawModule } from "./draw/draw.module";
import { ImageModule } from "./image/image.module";
import { SessionModule } from "./session/session.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("mongodb.uri"),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    CommonModule,
    VoiceModule,
    LLMModule,
    DrawModule,
    ImageModule,
    SessionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
