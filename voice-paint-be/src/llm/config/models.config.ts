export const MODEL_CONFIGS = {
  "deepseek-v3": {
    model: "deepseek-ai/DeepSeek-V3",
    temperature: 0.3,
    maxTokens: 1024,
    useCase: "意图识别 / Prompt 构造",
  },
  "deepseek-r1": {
    model: "deepseek-ai/DeepSeek-R1",
    temperature: 0.5,
    maxTokens: 4096,
    useCase: "复杂多轮对话推理",
  },
  "qwen-vision": {
    model: "Qwen/Qwen3.6-35B-A3B",
    temperature: 0.7,
    maxTokens: 2048,
    useCase: "视觉分析 / 多模态对话",
  },
};
