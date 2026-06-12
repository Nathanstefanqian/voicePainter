import { IsOptional, IsString, IsEnum } from "class-validator";
import { Transform } from "class-transformer";

export enum AsrProviderEnum {
  VOLC = "volc",
  TENCENT = "tencent",
}

export class VoiceRecognizeDto {
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @IsEnum(AsrProviderEnum)
  @Transform(({ value }: { value: string | undefined }) => value || AsrProviderEnum.VOLC)
  provider?: AsrProviderEnum = AsrProviderEnum.VOLC;
}
