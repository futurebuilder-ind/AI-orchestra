import { AIProvider, AIRequest, AIResponse, ModelCapabilities } from '../AIProvider.js';

export class GeminiProvider implements AIProvider {
  public name = 'Gemini';
  private apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || null;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
        { signal: controller.signal }
      );
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
    if (!this.apiKey) return ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
        { signal: controller.signal }
      );
      clearTimeout(id);

      if (!response.ok) return ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      const data = await response.json() as { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> };
      if (!data.models) return ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      
      const filtered = data.models
        .filter(m => {
          const name = m.name.toLowerCase();
          const supportsContent = !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent');
          const isNonText = name.includes('-tts') || name.includes('-embedding') || name.includes('-imagen') || name.includes('-audio') || name.includes('-realtime');
          return name.includes('gemini-') && supportsContent && !isNonText;
        })
        .map(m => m.name.split('/').pop() || m.name);

      return filtered.length > 0 ? filtered : ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    } catch {
      return ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
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
    throw new Error('Gemini API fetch retries exhausted');
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    try {
      const modelName = request.model.replace(/^models\//, '');
      const model = `models/${modelName}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${this.apiKey}`;

      const systemMessages = request.messages.filter(m => m.role === 'system');
      let systemInstructionText = request.system || '';
      if (systemMessages.length > 0) {
        systemInstructionText += (systemInstructionText ? '\n' : '') + systemMessages.map(m => m.content).join('\n');
      }

      const contents = request.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const body: any = {
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.7
        }
      };

      if (systemInstructionText) {
        body.systemInstruction = {
          parts: [{ text: systemInstructionText }]
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      const signal = request.signal || controller.signal;

      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify(body)
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini returned an empty response or blocked content');
      }

      return {
        content: text,
        modelUsed: request.model,
        provider: this.name
      };
    } catch (error: any) {
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }

  async stream(request: AIRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    try {
      const modelName = request.model.replace(/^models\//, '');
      const model = `models/${modelName}`;
      const url = `https://generativelanguage.googleapis.com/v1beta/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

      const systemMessages = request.messages.filter(m => m.role === 'system');
      let systemInstructionText = request.system || '';
      if (systemMessages.length > 0) {
        systemInstructionText += (systemInstructionText ? '\n' : '') + systemMessages.map(m => m.content).join('\n');
      }

      const contents = request.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const body: any = {
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.7
        }
      };

      if (systemInstructionText) {
        body.systemInstruction = {
          parts: [{ text: systemInstructionText }]
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);
      const signal = request.signal || controller.signal;

      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify(body)
      });
      clearTimeout(timeoutId);

      if (!response.ok || !response.body) {
        throw new Error(`Gemini stream error (${response.status})`);
      }

      let fullText = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6));
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                fullText += text;
                onChunk(text);
              }
            } catch {
              // Ignore incomplete SSE json chunks
            }
          }
        }
      }

      return {
        content: fullText,
        modelUsed: request.model,
        provider: this.name
      };
    } catch (error: any) {
      // Fallback to generate if stream fails
      const res = await this.generate(request);
      onChunk(res.content);
      return res;
    }
  }

  getCapabilities(model: string): ModelCapabilities {
    return {
      multimodal: true,
      contextWindow: model.includes('1.5') || model.includes('2.0') ? 1000000 : 32768,
      type: 'cloud'
    };
  }
}
