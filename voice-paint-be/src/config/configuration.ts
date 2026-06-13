import { configValidationSchema } from "./config.validation";

export default () => ({
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  apiPrefix: process.env.API_PREFIX || "api",

  mongodb: {
    uri: process.env.MONGODB_URI || "",
  },

  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ||
      "default-access-secret-change-in-production",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ||
      "default-refresh-secret-change-in-production",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  volc: {
    appId: process.env.VOLC_APP_ID || "",
    accessToken: process.env.VOLC_ACCESS_TOKEN || "",
    secretKey: process.env.VOLC_SECRET_KEY || "",
    arkApiKey: process.env.VOLC_ARK_API_KEY || "",
    arkModelId: process.env.VOLC_ARK_MODEL_ID || "doubao-seedream-5-0-260128",
  },

  tencentCloud: {
    secretId: process.env.TENCENT_CLOUD_SECRET_ID || "",
    secretKey: process.env.TENCENT_CLOUD_SECRET_KEY || "",
    appId: process.env.TENCENT_CLOUD_APP_ID || "",
  },

  siliconFlow: {
    apiKey: process.env.SILICONFLOW_API_KEY || "",
  },

  aliyunOss: {
    region: process.env.ALIYUN_OSS_REGION || "",
    accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID || "",
    accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || "",
    bucket: process.env.ALIYUN_OSS_BUCKET || "",
  },

  configValidationSchema,
});
