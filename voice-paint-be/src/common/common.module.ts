import { Module } from "@nestjs/common";
import { OssService } from "./services/oss.service";

@Module({
  providers: [OssService],
  exports: [OssService],
})
export class CommonModule {}
