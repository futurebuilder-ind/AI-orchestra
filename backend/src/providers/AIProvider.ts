export interface ModelCapabilities {
  multimodal: boolean;
  contextWindow: number;
  type: 'local' | 'cloud' | 'simulated';
}

export interface AIRequest {
  model: string;
  system?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface AIResponse {
  content: string;
  modelUsed: string;
  provider?: string;
}

export interface AIProvider {
  name: string;
  generate(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest, onChunk: (chunk: string) => void): Promise<AIResponse>;
  healthCheck(): Promise<boolean>;
  getModels(): Promise<string[]>;
  getCapabilities(model: string): ModelCapabilities;
}

