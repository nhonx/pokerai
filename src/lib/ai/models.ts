export interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  description: string;
}
export const RECOMMENDED_MODELS: OpenRouterModel[] = [
  {
    id: "inclusionai/ling-3.0-flash",
    name: "InclusionAI Ling 3.0 Flash",
    provider: "InclusionAI",
    contextLength: 262000,
    description: "",
  },
  {
    id: "inception/mercury-2.5",
    name: "Inception Mercury 2.5",
    provider: "Inception",
    contextLength: 262000,
    description: "",
  },
  {
    id: "qwen/qwen3-30b-a3b-instruct-2507",
    name: "Qwen 3-30B A3B Instruct 2507",
    provider: "Qwen",
    contextLength: 262000,
    description: "",
  },
  {
    id: "mistralai/mistral-nemo",
    name: "Mistralai Mistral Nemo",
    provider: "Mistralai",
    contextLength: 131000,
    description: "",
  },
  {
    id: "meta-llama/llama-3.1-8b-instruct",
    name: "Meta Llama 3.1 8B Instruct",
    provider: "Meta Llama",
    contextLength: 131000,
    description: "",
  },
  {
    id: "openai/gpt-oss-20b",
    name: "OpenAI GPT OSS 20B",
    provider: "OpenAI",
    contextLength: 131000,
    description: "",
  },
  {
    id: "xiaomi/mimo-v2.5",
    name: "Xiaomi Mimo v2.5",
    provider: "Xiaomi",
    contextLength: 1000000,
    description: "",
  },
  {
    id: "deepseek/deepseek-v3.2",
    name: "DeepSeek DeepSeek v3.2",
    provider: "DeepSeek",
    contextLength: 1000000,
    description: "",
  },
];

export const FREE_MODELS: OpenRouterModel[] = [
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    name: "NVIDIA Nemotron 3 Ultra 550B A55B",
    provider: "NVIDIA",
    contextLength: 10000000,
    description: "Free, highly capable, balanced strategy and great banter.",
  },
  {
    id: "poolside/laguna-s-2.1:free",
    name: "Laguna S 2.1",
    provider: "Poolside",
    contextLength: 262000,
    description: "Fast, high reasoning capability, good for poker strategy.",
  },
  {
    id: "dots-studio/dots-3-note-preview:free",
    name: "Dots 3",
    provider: "Dots Studio",
    contextLength: 512000,
    description: "Ultra-fast and economical with reliable JSON adherence.",
  },
  {
    id: "thinkingmachines/inkling:free",
    name: "Inkling",
    provider: "Thinking Machines",
    contextLength: 1048576,
    description: "Fast reasoning, solid poker player.",
  },
  {
    id: "qwen/qwen3.8-27b:free",
    name: "Qwen 3.8 27B",
    provider: "Qwen",
    contextLength: 262000,
    description: "Good reasoning, decent conversationalist.",
  },
];

export const ALL_MODELS: OpenRouterModel[] = [
  ...RECOMMENDED_MODELS,
  // ...FREE_MODELS,
];
