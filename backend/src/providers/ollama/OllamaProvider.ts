import { AIProvider, AIRequest, AIResponse, ModelCapabilities } from '../AIProvider.js';

export function stripThinking(text: string): string {
  if (!text) return '';
  // Remove <think>...</think> and <reasoning>...</reasoning> blocks
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  // Remove unclosed <think>... or <reasoning>... blocks
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, '');
  cleaned = cleaned.replace(/<reasoning>[\s\S]*/gi, '');
  return cleaned.trim();
}

export class OllamaProvider implements AIProvider {
  public name = 'Ollama';
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.OLLAMA_BASE_URL || process.env.OLLAMA_API_BASE || 'http://localhost:11434';
  }

  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500); // 1.5 second timeout for connection check
      
      const response = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(id);
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    return this.listModels();
  }

  async listModels(): Promise<string[]> {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(id);

      if (!response.ok) {
        return [];
      }
      const data = (await response.json()) as { models?: Array<{ name: string }> };
      if (!data.models) return [];
      
      return data.models.map(m => m.name);
    } catch (error) {
      return [];
    }
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    try {
      const messages = [];
      if (request.system) {
        messages.push({ role: 'system', content: request.system });
      }
      messages.push(...request.messages);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const signal = request.signal || controller.signal;

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal,
        body: JSON.stringify({
          model: request.model,
          messages: messages,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.maxTokens ?? 512
          },
          stream: false
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as { message?: { content: string } };
      if (!data.message?.content) {
        throw new Error('Ollama returned an empty response');
      }

      const cleanedContent = stripThinking(data.message.content);

      return {
        content: cleanedContent,
        modelUsed: request.model,
        provider: this.name
      };
    } catch (error: any) {
      throw new Error(`Ollama generation failed for model ${request.model}: ${error.message}`);
    }
  }

  async stream(request: AIRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    try {
      const messages = [];
      if (request.system) {
        messages.push({ role: 'system', content: request.system });
      }
      messages.push(...request.messages);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const signal = request.signal || controller.signal;

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal,
        body: JSON.stringify({
          model: request.model,
          messages: messages,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.maxTokens ?? 1024
          },
          stream: true
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok || !response.body) {
        throw new Error(`Ollama stream failed (${response.status})`);
      }

      let fullContent = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message?.content) {
              fullContent += parsed.message.content;
              onChunk(parsed.message.content);
            }
          } catch {
            // Ignore parse errors on incomplete chunks
          }
        }
      }

      return {
        content: stripThinking(fullContent),
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
    const nameLower = model.toLowerCase();
    const isMultimodal = nameLower.includes('llava') || nameLower.includes('vision') || nameLower.includes('gemma2');
    let contextWindow = 2048;
    if (nameLower.includes('llama3') || nameLower.includes('qwen2') || nameLower.includes('qwen3')) {
      contextWindow = 8192;
    } else if (nameLower.includes('mistral') || nameLower.includes('gemma')) {
      contextWindow = 4096;
    }
    return {
      multimodal: isMultimodal,
      contextWindow: contextWindow,
      type: 'local'
    };
  }
}

