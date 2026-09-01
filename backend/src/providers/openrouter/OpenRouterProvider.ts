import { AIProvider, AIRequest, AIResponse, ModelCapabilities } from '../AIProvider.js';

export const DEFAULT_OPENROUTER_FREE_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-r1:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free'
];

export class OpenRouterProvider implements AIProvider {
  public name = 'OpenRouter';
  private apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || null;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: controller.signal
      });
      clearTimeout(id);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    return this.listModels();
  }

  async listModels(): Promise<string[]> {
    if (!this.apiKey) return DEFAULT_OPENROUTER_FREE_MODELS;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: controller.signal
      });
      clearTimeout(id);

      if (!response.ok) return DEFAULT_OPENROUTER_FREE_MODELS;
      const data = await response.json() as { data?: Array<{ id: string }> };
      if (!data.data) return DEFAULT_OPENROUTER_FREE_MODELS;

      const freeModels = data.data
        .map(m => m.id)
        .filter(id => id.endsWith(':free'));

      return freeModels.length > 0 ? freeModels : DEFAULT_OPENROUTER_FREE_MODELS;
    } catch {
      return DEFAULT_OPENROUTER_FREE_MODELS;
    }
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 2, delayMs = 1000): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, options);
        if (res.status === 429 && attempt < retries) {
          await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)));
          continue;
        }
        return res;
      } catch (err: any) {
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)));
      }
    }
    throw new Error('OpenRouter API fetch retries exhausted');
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured.');
    }

    try {
      const messages = [];
      if (request.system) {
        messages.push({ role: 'system', content: request.system });
      }
      messages.push(...request.messages);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const signal = request.signal || controller.signal;

      const response = await this.fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ai-orchestra.vercel.app',
          'X-Title': 'AI Orchestra'
        },
        signal,
        body: JSON.stringify({
          model: request.model,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1024
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as { choices?: Array<{ message?: { content: string } }> };
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenRouter returned an empty response');
      }

      return {
        content,
        modelUsed: request.model,
        provider: this.name
      };
    } catch (error: any) {
      throw new Error(`OpenRouter generation failed for ${request.model}: ${error.message}`);
    }
  }

  async stream(request: AIRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured.');
    }

    try {
      const messages = [];
      if (request.system) {
        messages.push({ role: 'system', content: request.system });
      }
      messages.push(...request.messages);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);
      const signal = request.signal || controller.signal;

      const response = await this.fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ai-orchestra.vercel.app',
          'X-Title': 'AI Orchestra'
        },
        signal,
        body: JSON.stringify({
          model: request.model,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1024,
          stream: true
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok || !response.body) {
        throw new Error(`OpenRouter stream failed (${response.status})`);
      }

      let fullContent = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const json = JSON.parse(dataStr);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                fullContent += delta;
                onChunk(delta);
              }
            } catch {
              // Ignore incomplete SSE json chunks
            }
          }
        }
      }

      return {
        content: fullContent,
        modelUsed: request.model,
        provider: this.name
      };
    } catch (error: any) {
      const res = await this.generate(request);
      onChunk(res.content);
      return res;
    }
  }

  getCapabilities(model: string): ModelCapabilities {
    return {
      multimodal: model.includes('vision') || model.includes('gemini'),
      contextWindow: 128000,
      type: 'cloud'
    };
  }
}
