import { stripThinking } from '../providers/ollama/OllamaProvider.js';
import { AIProvider, AIRequest } from '../providers/AIProvider.js';
import { ProviderRegistry, ProviderStatus } from '../providers/ProviderRegistry.js';
import { executeCode } from '../sandbox/Sandbox.js';
import { searchWeb } from '../tools/WebSearch.js';

export type CouncilMode = 'single' | 'multi' | 'deep' | 'auto';

export interface OrchestratorConfig {
  ollamaUrl?: string;
  geminiApiKey?: string;
  openrouterApiKey?: string;
  sandboxEnabled?: boolean;
  maxIterations?: number;
  selectedModels?: string[];
  agentCount?: number | 'Auto';
  councilMode?: CouncilMode;
}

export interface AgentRunInfo {
  agentId: string;
  model: string;
  role: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  executionTimeSec?: number;
  response?: string;
  error?: string;
  codeRun?: any;
}

export interface StepLog {
  step: 'analysis' | 'research' | 'parallel_execution' | 'sandbox' | 'critic' | 'refinement' | 'synthesizing';
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  data?: any;
}

export interface OrchestrationResult {
  finalAnswer: string;
  stepLogs: StepLog[];
  modelsUsed: string[];
  agents?: Array<{
    agentId: string;
    model: string;
    role: string;
    status: 'completed' | 'failed' | 'queued' | 'processing';
    executionTimeSec?: number;
    response?: string;
    error?: string;
  }>;
}

export class Orchestrator {
  private registry: ProviderRegistry;

  constructor(config?: { ollamaUrl?: string; geminiApiKey?: string; openrouterApiKey?: string }) {
    this.registry = new ProviderRegistry(config);
  }

  public registerProvider(modelName: string, provider: AIProvider) {
    this.registry.registerCustomProvider(modelName, provider);
  }

  public getRegistry(): ProviderRegistry {
    return this.registry;
  }

  // Task analysis & complexity heuristic
  public async analyzeTask(query: string, defaultModel?: string): Promise<{ taskType: string; explanation: string; suggestedAgents: number }> {
    const queryLower = query.toLowerCase();
    const wordCount = query.split(/\s+/).length;

    const mathKeywords = ['solve for', 'integral', 'derivative', 'calculate', 'equation', 'algebra', 'calculus', 'arithmetic', 'matrix', 'fibonacci', 'factorial'];
    const progKeywords = ['write a function', 'write code', 'javascript', 'python', 'compile', 'sandbox', 'class', 'function', 'variable', 'syntax error', 'programming', 'bug', 'html', 'css', 'typescript'];
    const researchKeywords = ['latest', 'recent', 'who won', 'current weather', 'search for', 'news about', 'current state of'];
    const simpleKeywords = ['hello', 'hi', 'hey', 'how are you', 'thank you', 'who are you', 'ok', 'yes', 'no'];

    if (simpleKeywords.some(kw => queryLower.startsWith(kw) || queryLower === kw) && wordCount < 6) {
      return { taskType: 'Simple', explanation: 'Brief query or standard greeting.', suggestedAgents: 1 };
    }
    if (mathKeywords.some(kw => queryLower.includes(kw))) {
      return { taskType: 'Mathematics', explanation: 'Mathematical calculation keywords detected.', suggestedAgents: 3 };
    }
    if (progKeywords.some(kw => queryLower.includes(kw))) {
      return { taskType: 'Programming', explanation: 'Coding terms detected.', suggestedAgents: 4 };
    }
    if (researchKeywords.some(kw => queryLower.includes(kw))) {
      return { taskType: 'Research', explanation: 'Research or factual queries detected.', suggestedAgents: 5 };
    }

    if (defaultModel) {
      try {
        const systemPrompt = `Analyze the query and classify into: Mathematics, Programming, Research, Writing, Logic, Simple.
Return JSON: {"type": "classification", "explanation": "reasoning", "complexity": "easy|moderate|complex|deep"}`;

        const response = await this.registry.generateWithFallback({
          model: defaultModel,
          system: systemPrompt,
          messages: [{ role: 'user', content: query }],
          temperature: 0.1
        });

        const data = JSON.parse(response.content.trim());
        let count = 3;
        if (data.complexity === 'easy') count = 1;
        if (data.complexity === 'moderate') count = 3;
        if (data.complexity === 'complex') count = 5;
        if (data.complexity === 'deep') count = 8;

        return { taskType: data.type || 'Logic', explanation: data.explanation || 'LLM classified', suggestedAgents: count };
      } catch (err) {
        // Fallback to default heuristic if LLM call fails
      }
    }

    return { taskType: 'Logic', explanation: 'General reasoning query.', suggestedAgents: 3 };
  }

  private extractCodeBlock(text: string): string | null {
    const jsRegex = /```(?:javascript|js)\n([\s\S]*?)\n```/i;
    const match = text.match(jsRegex);
    return match ? match[1].trim() : null;
  }

  // Generate specialized role titles and prompts
  private getRoleSpecs(targetCount: number): Array<{ role: string; systemPrompt: string }> {
    const roles: Array<{ role: string; systemPrompt: string }> = [
      {
        role: 'Solver',
        systemPrompt: 'You are AGENT 01 (Primary Solver). Provide a complete, rigorous, step-by-step solution.'
      },
      {
        role: 'Independent Solver',
        systemPrompt: 'You are AGENT 02 (Independent Solver). Solve the problem from first principles without relying on standard assumptions.'
      },
      {
        role: 'Alternative Solver',
        systemPrompt: 'You are AGENT 03 (Alternative Solver). Explore an alternative or secondary approach to verify structural accuracy.'
      },
      {
        role: 'Critic',
        systemPrompt: 'You are AGENT 04 (Critic & Discrepancy Evaluator). Analyze edge cases, logic gaps, or potential errors.'
      },
      {
        role: 'Fact Checker',
        systemPrompt: 'You are AGENT 05 (Fact Checker & Logic Verifier). Validate all facts, definitions, syntax, and assumptions.'
      },
      {
        role: 'Code Reviewer',
        systemPrompt: 'You are AGENT 06 (Code Reviewer & Sandbox Verifier). Check code syntax, efficiency, boundary conditions, and imports.'
      },
      {
        role: 'Mathematical Verifier',
        systemPrompt: 'You are AGENT 07 (Mathematical Verifier). Check equation steps, arithmetic, matrix ops, and logical deductions.'
      },
      {
        role: 'Edge Case Specialist',
        systemPrompt: 'You are AGENT 08 (Edge Case Specialist). Inspect extreme inputs, empty states, scale limits, and failure modes.'
      },
      {
        role: 'Refinement Specialist',
        systemPrompt: 'You are AGENT 09 (Refinement Specialist). Polish explanations for clarity, elegance, and thoroughness.'
      },
      {
        role: 'Executive Synthesizer',
        systemPrompt: 'You are AGENT 10 (Executive Synthesizer). Integrate findings into a final authoritative solution.'
      }
    ];

    return roles.slice(0, targetCount);
  }

  // Main Orchestration execution
  public async orchestrate(
    query: string,
    fileContext: string = '',
    config: OrchestratorConfig = {}
  ): Promise<OrchestrationResult> {
    return this.orchestrateStream(query, fileContext, config);
  }

  // Orchestration with optional streaming callbacks
  public async orchestrateStream(
    query: string,
    fileContext: string = '',
    config: OrchestratorConfig = {},
    onStepUpdate?: (log: StepLog) => void,
    onSynthesizeChunk?: (chunk: string) => void
  ): Promise<OrchestrationResult> {
    const stepLogs: StepLog[] = [];
    const modelsUsed: string[] = [];
    
    let availableModels = (config.selectedModels && config.selectedModels.length > 0)
      ? config.selectedModels
      : [];

    if (availableModels.length === 0) {
      const status = await this.registry.getStatus();
      availableModels = status.freeModels.length > 0 ? status.freeModels : status.allAvailableModels;
    }

    if (availableModels.length === 0) {
      availableModels = ['google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.3-70b-instruct:free', 'gemini-2.0-flash'];
    }

    const defaultModel = availableModels[0];

    const pushStepLog = (log: StepLog) => {
      const existingIdx = stepLogs.findIndex(s => s.step === log.step);
      if (existingIdx >= 0) {
        stepLogs[existingIdx] = log;
      } else {
        stepLogs.push(log);
      }
      if (onStepUpdate) onStepUpdate(log);
    };

    // 1. ANALYSIS STEP
    pushStepLog({ step: 'analysis', status: 'running', message: 'Analyzing query complexity & assigning council roles...' });
    const { taskType, explanation, suggestedAgents } = await this.analyzeTask(query, defaultModel);

    // Calculate effective agent count based on mode & config
    const mode = config.councilMode || 'auto';
    let effectiveCount = 3;
    if (mode === 'single') {
      effectiveCount = 1;
    } else if (mode === 'deep') {
      effectiveCount = typeof config.agentCount === 'number' ? Math.max(5, Math.min(config.agentCount, 10)) : 8;
    } else if (mode === 'multi') {
      effectiveCount = typeof config.agentCount === 'number' ? Math.max(2, Math.min(config.agentCount, 4)) : 3;
    } else {
      // Auto mode
      if (taskType === 'Simple') effectiveCount = 1;
      else if (config.agentCount && config.agentCount !== 'Auto') effectiveCount = Number(config.agentCount) || 3;
      else effectiveCount = suggestedAgents;
    }

    effectiveCount = Math.min(Math.max(effectiveCount, 1), 10);

    pushStepLog({
      step: 'analysis',
      status: 'completed',
      message: `Task Classified: **${taskType}** — Allocated **${effectiveCount} Agent(s)** (${mode.toUpperCase()} Mode)`,
      data: { taskType, explanation, effectiveCount }
    });

    // 2. OPTIONAL WEB RESEARCH
    let researchContext = '';
    if (taskType === 'Research') {
      pushStepLog({ step: 'research', status: 'running', message: `Conducting web research for: "${query}"` });
      try {
        const searchResults = await searchWeb(query);
        if (searchResults.length > 0) {
          researchContext = searchResults
            .map((res, idx) => `[Source ${idx + 1}] ${res.title}\nURL: ${res.url}\nSummary: ${res.snippet}`)
            .join('\n\n');
          
          pushStepLog({
            step: 'research',
            status: 'completed',
            message: `Retrieved ${searchResults.length} source(s) from web search.`,
            data: searchResults
          });
        } else {
          pushStepLog({
            step: 'research',
            status: 'completed',
            message: `Web research completed: No public sources matched.`,
            data: []
          });
        }
      } catch (err: any) {
        pushStepLog({
          step: 'research',
          status: 'failed',
          message: `Web research skipped: ${err.message}`
        });
      }
    }

    // Prepare Prompt Context
    let promptContext = '';
    if (fileContext) promptContext += `\n\n[CONTEXT FROM DOCUMENTS]:\n${fileContext}\n\n`;
    if (researchContext) promptContext += `\n\n[CONTEXT FROM WEB RESEARCH]:\n${researchContext}\n\n`;

    // 3. ROLE ALLOCATION & AGENT POOL INITIALIZATION
    const roleSpecs = this.getRoleSpecs(effectiveCount);
    const agentPool: AgentRunInfo[] = roleSpecs.map((spec, idx) => {
      const model = availableModels[idx % availableModels.length];
      return {
        agentId: `AGENT 0${idx + 1}`,
        model,
        role: spec.role,
        status: 'queued'
      };
    });

    pushStepLog({
      step: 'parallel_execution',
      status: 'running',
      message: `Dispatched Agent Pool (${effectiveCount} Agents across ${availableModels.length} Model(s))...`,
      data: agentPool.map(a => ({ agentId: a.agentId, model: a.model, role: a.role, status: a.status }))
    });

    // 4. CONTROLLED CONCURRENCY QUEUE EXECUTION (Batch of 2 to respect serverless limits)
    const BATCH_SIZE = 2;
    for (let i = 0; i < agentPool.length; i += BATCH_SIZE) {
      const chunk = agentPool.slice(i, i + BATCH_SIZE);
      
      chunk.forEach(a => a.status = 'processing');
      pushStepLog({
        step: 'parallel_execution',
        status: 'running',
        message: `Executing agents (${i + 1}-${Math.min(i + BATCH_SIZE, agentPool.length)} of ${effectiveCount})...`,
        data: agentPool.map(a => ({
          agentId: a.agentId,
          model: a.model,
          role: a.role,
          status: a.status
        }))
      });

      await Promise.all(chunk.map(async (agent, chunkIdx) => {
        const globalIdx = i + chunkIdx;
        const spec = roleSpecs[globalIdx];
        const startTime = Date.now();

        try {
          const req: AIRequest = {
            model: agent.model,
            system: spec.systemPrompt,
            messages: [{ role: 'user', content: query + promptContext }],
            temperature: 0.6
          };

          // Use ProviderRegistry with fallback to other available models
          const fallbacks = availableModels.filter(m => m !== agent.model);
          const res = await this.registry.generateWithFallback(req, fallbacks);
          
          if (!modelsUsed.includes(res.modelUsed)) modelsUsed.push(res.modelUsed);
          agent.status = 'completed';
          agent.executionTimeSec = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
          agent.response = stripThinking(res.content);
        } catch (err: any) {
          agent.status = 'failed';
          agent.error = err.message || 'Provider execution failed';
          agent.response = '';
        }
      }));
    }

    const successfulAgents = agentPool.filter(a => a.status === 'completed');

    pushStepLog({
      step: 'parallel_execution',
      status: successfulAgents.length > 0 ? 'completed' : 'failed',
      message: `Council Agent Execution complete (${successfulAgents.length}/${effectiveCount} successful).`,
      data: agentPool.map(a => ({
        agentId: a.agentId,
        model: a.model,
        role: a.role,
        status: a.status,
        executionTimeSec: a.executionTimeSec,
        resultSummary: a.response ? a.response.substring(0, 140) + '...' : undefined,
        error: a.error
      }))
    });

    if (successfulAgents.length === 0) {
      throw new Error('All configured AI providers are temporarily unavailable.');
    }

    // SINGLE MODE DIRECT RETURN
    if (mode === 'single' || effectiveCount === 1) {
      const singleAgent = successfulAgents[0];
      pushStepLog({
        step: 'synthesizing',
        status: 'completed',
        message: 'Single agent response rendered directly.'
      });

      if (onSynthesizeChunk && singleAgent.response) {
        onSynthesizeChunk(singleAgent.response);
      }

      return {
        finalAnswer: singleAgent.response || '',
        stepLogs,
        modelsUsed,
        agents: agentPool
      };
    }

    // 5. CODE SANDBOX EXECUTION (For programming tasks)
    if (taskType === 'Programming' && config.sandboxEnabled && successfulAgents.length > 0) {
      pushStepLog({ step: 'sandbox', status: 'running', message: 'Analyzing generated code blocks in sandbox...' });
      const sandboxRuns = [];

      for (const agent of successfulAgents) {
        if (agent.response) {
          const jsCode = this.extractCodeBlock(agent.response);
          if (jsCode) {
            const runResult = await executeCode(jsCode);
            agent.codeRun = runResult;
            sandboxRuns.push({
              agentId: agent.agentId,
              model: agent.model,
              success: runResult.success,
              stdout: runResult.stdout,
              stderr: runResult.stderr,
              error: runResult.error
            });
          }
        }
      }

      pushStepLog({
        step: 'sandbox',
        status: 'completed',
        message: `Executed ${sandboxRuns.length} code block(s) in sandbox.`,
        data: sandboxRuns
      });
    }

    // 6. CRITIC EVALUATION (If > 1 agent run)
    let criticFeedback = '';
    if (successfulAgents.length > 1) {
      pushStepLog({ step: 'critic', status: 'running', message: 'Critic evaluating agent outputs for contradictions...' });
      
      try {
        let criticInput = `User Query: "${query}"\n\n`;
        successfulAgents.forEach((a) => {
          criticInput += `[${a.agentId} - Model: ${a.model} - Role: ${a.role}]:\n${a.response}\n`;
          if (a.codeRun) {
            criticInput += `[SANDBOX RUN RESULT]: Success=${a.codeRun.success}, Output=${a.codeRun.stdout}\n`;
          }
          criticInput += `\n---\n\n`;
        });

        const criticSystem = `You are the Expert Critic of the AI Council.
Analyze candidate answers for contradictions, logic flaws, mathematical errors, or code bugs.
Identify which agents are correct and outline any discrepancies.`;

        const criticResponse = await this.registry.generateWithFallback({
          model: defaultModel,
          system: criticSystem,
          messages: [{ role: 'user', content: criticInput }],
          temperature: 0.2
        }, availableModels);

        criticFeedback = criticResponse.content;

        pushStepLog({
          step: 'critic',
          status: 'completed',
          message: 'Critic evaluation complete.',
          data: { criticFeedback }
        });
      } catch (err: any) {
        pushStepLog({
          step: 'critic',
          status: 'failed',
          message: `Critic phase skipped: ${err.message}`
        });
      }
    }

    // 7. SYNTHESIZER
    pushStepLog({ step: 'synthesizing', status: 'running', message: 'Synthesizing council consensus solution...' });

    try {
      let synthInput = `Original Query: "${query}"\n\n`;
      successfulAgents.forEach((a) => {
        synthInput += `[${a.agentId} (${a.model} - ${a.role})]:\n${a.response}\n\n`;
      });

      if (criticFeedback) {
        synthInput += `Critic Evaluation:\n${criticFeedback}\n\n`;
      }

      const synthSystem = `You are the Executive Synthesizer of the AI Council.
Synthesize the outputs from all council agents into a unified, clean, definitive answer.
Guidelines:
1. Provide a direct, authoritative, and elegant solution.
2. Incorporate code execution / calculation results naturally.
3. Do NOT display meta-commentary like "Agent 1 said X". Present the final unified result.`;

      let finalAnswer = '';

      if (onSynthesizeChunk) {
        const res = await this.registry.streamWithFallback(
          {
            model: defaultModel,
            system: synthSystem,
            messages: [{ role: 'user', content: synthInput }],
            temperature: 0.3
          },
          onSynthesizeChunk,
          availableModels
        );
        finalAnswer = res.content;
      } else {
        const res = await this.registry.generateWithFallback(
          {
            model: defaultModel,
            system: synthSystem,
            messages: [{ role: 'user', content: synthInput }],
            temperature: 0.3
          },
          availableModels
        );
        finalAnswer = res.content;
      }

      pushStepLog({
        step: 'synthesizing',
        status: 'completed',
        message: 'Council consensus synthesized successfully.'
      });

      return {
        finalAnswer: stripThinking(finalAnswer),
        stepLogs,
        modelsUsed,
        agents: agentPool
      };
    } catch (err: any) {
      pushStepLog({
        step: 'synthesizing',
        status: 'failed',
        message: `Synthesis fallback: ${err.message}`
      });

      const fallback = successfulAgents[0];
      const fallbackAnswer = fallback ? stripThinking(fallback.response!) : 'All models failed to generate a response.';

      if (onSynthesizeChunk) {
        onSynthesizeChunk(fallbackAnswer);
      }

      return {
        finalAnswer: fallbackAnswer,
        stepLogs,
        modelsUsed,
        agents: agentPool
      };
    }
  }
}
