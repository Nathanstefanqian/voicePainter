import * as Joi from "joi";

export const configValidationSchema = Joi.object({
  // 基础配置
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default("api"),

  // MongoDB
  MONGODB_URI: Joi.string().required(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().required().min(32),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_SECRET: Joi.string().required().min(32),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),

  // 火山引擎 - 语音识别
  VOLC_APP_ID: Joi.string().required(),
  VOLC_ACCESS_TOKEN: Joi.string().required(),
  VOLC_SECRET_KEY: Joi.string().required(),

  // 火山方舟 - 图像生成
  VOLC_ARK_API_KEY: Joi.string().required(),
  VOLC_ARK_MODEL_ID: Joi.string().default("doubao-seedream-5-0-260128"),

  // 腾讯云 - 语音识别
  TENCENT_CLOUD_SECRET_ID: Joi.string().required(),
  TENCENT_CLOUD_SECRET_KEY: Joi.string().required(),
  TENCENT_CLOUD_APP_ID: Joi.string().required(),

  // 硅基流动 - DeepSeek
  SILICONFLOW_API_KEY: Joi.string().required(),

  // 阿里云 OSS
  ALIYUN_OSS_REGION: Joi.string().required(),
  ALIYUN_OSS_ACCESS_KEY_ID: Joi.string().required(),
  ALIYUN_OSS_ACCESS_KEY_SECRET: Joi.string().required(),
  ALIYUN_OSS_BUCKET: Joi.string().required(),
});
