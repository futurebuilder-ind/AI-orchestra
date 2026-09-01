import { AIProvider, AIRequest, AIResponse } from './AIProvider.js';
import { OllamaProvider } from './ollama/OllamaProvider.js';
import { GeminiProvider } from './gemini/GeminiProvider.js';
import { OpenRouterProvider, DEFAULT_OPENROUTER_FREE_MODELS } from './openrouter/OpenRouterProvider.js';

export interface ProviderStatus {
  ollamaAvailable: boolean;
  ollamaModels: string[];
  geminiAvailable: boolean;
  geminiModels: string[];
  openrouterAvailable: boolean;
  openrouterModels: string[];
  allAvailableModels: string[];
  freeModels: string[];
}

export class ProviderRegistry {
  private ollama: OllamaProvider;
  private gemini: GeminiProvider;
  private openrouter: OpenRouterProvider;
  private customProviders: Map<string, AIProvider> = new Map();

  constructor(config?: { ollamaUrl?: string; geminiApiKey?: string; openrouterApiKey?: string }) {
    this.ollama = new OllamaProvider(config?.ollamaUrl);
    this.gemini = new GeminiProvider(config?.geminiApiKey);
    this.openrouter = new OpenRouterProvider(config?.openrouterApiKey);
  }

  public registerCustomProvider(modelName: string, provider: AIProvider) {
    this.customProviders.set(modelName, provider);
  }

  public updateKeys(config: { ollamaUrl?: string; geminiApiKey?: string; openrouterApiKey?: string }) {
    if (config.ollamaUrl) this.ollama = new OllamaProvider(config.ollamaUrl);
    if (config.geminiApiKey) this.gemini.setApiKey(config.geminiApiKey);
    if (config.openrouterApiKey) this.openrouter.setApiKey(config.openrouterApiKey);
  }

  public async getStatus(): Promise<ProviderStatus> {
    const [ollamaAvailable, geminiAvailable, openrouterAvailable] = await Promise.all([
      this.ollama.healthCheck(),
      this.gemini.healthCheck(),
      this.openrouter.healthCheck()
    ]);

    const [ollamaModels, geminiModels, openrouterModels] = await Promise.all([
      ollamaAvailable ? this.ollama.getModels() : Promise.resolve([]),
      geminiAvailable ? this.gemini.getModels() : Promise.resolve([]),
      openrouterAvailable ? this.openrouter.getModels() : Promise.resolve([])
    ]);

    const allAvailableModels: string[] = [
      ...ollamaModels,
      ...geminiModels,
      ...openrouterModels
    ];

    const freeModels: string[] = [
      ...ollamaModels,
      ...geminiModels.filter(m => m.includes('flash')),
      ...openrouterModels.filter(m => m.endsWith(':free'))
    ];

    return {
      ollamaAvailable,
      ollamaModels,
      geminiAvailable,
      geminiModels,
      openrouterAvailable,
      openrouterModels,
      allAvailableModels,
      freeModels
    };
  }

  public resolveProvider(modelName: string): { provider: AIProvider; model: string } {
    if (this.customProviders.has(modelName)) {
      return { provider: this.customProviders.get(modelName)!, model: modelName };
    }

    const nameLower = modelName.toLowerCase();

    // Check OpenRouter explicit or formatted models
    if (nameLower.includes('/') || nameLower.endsWith(':free') || DEFAULT_OPENROUTER_FREE_MODELS.includes(modelName)) {
      return { provider: this.openrouter, model: modelName };
    }

    // Check Gemini models
    if (nameLower.includes('gemini') || nameLower.startsWith('models/gemini')) {
      return { provider: this.gemini, model: modelName };
    }

    // Default local Ollama
    return { provider: this.ollama, model: modelName };
  }

  /**
   * Execute request with fallback across multiple providers/models if primary fails.
   */
  public async generateWithFallback(
    request: AIRequest,
    fallbackModels: string[] = []
  ): Promise<AIResponse> {
    const candidates = [request.model, ...fallbackModels.filter(m => m !== request.model)];
    let lastError: Error | null = null;

    for (const candidateModel of candidates) {
      try {
        const { provider, model } = this.resolveProvider(candidateModel);
        const req: AIRequest = { ...request, model };
        const response = await provider.generate(req);
        return response;
      } catch (err: any) {
        console.warn(`[ProviderRegistry] Candidate model ${candidateModel} failed: ${err.message}. Trying next fallback...`);
        lastError = err;
      }
    }

    throw lastError || new Error('All configured AI providers are temporarily unavailable.');
  }

  /**
   * Stream request with fallback across multiple providers/models.
   */
  public async streamWithFallback(
    request: AIRequest,
    onChunk: (chunk: string) => void,
    fallbackModels: string[] = []
  ): Promise<AIResponse> {
    const candidates = [request.model, ...fallbackModels.filter(m => m !== request.model)];
    let lastError: Error | null = null;

    for (const candidateModel of candidates) {
      try {
        const { provider, model } = this.resolveProvider(candidateModel);
        const req: AIRequest = { ...request, model };
        const response = await provider.stream(req, onChunk);
        return response;
      } catch (err: any) {
        console.warn(`[ProviderRegistry] Streaming model ${candidateModel} failed: ${err.message}. Trying fallback...`);
        lastError = err;
      }
    }

    throw lastError || new Error('All configured AI providers are temporarily unavailable.');
  }
}
