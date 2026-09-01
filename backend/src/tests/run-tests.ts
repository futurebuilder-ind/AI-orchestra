import assert from 'assert';
import { Orchestrator, OrchestratorConfig } from '../orchestrator/Orchestrator.js';
import { AIProvider, AIRequest, AIResponse, ModelCapabilities } from '../providers/AIProvider.js';
import { executeCode } from '../sandbox/Sandbox.js';

// 1. Mock AI Provider implementation
class MockAIProvider implements AIProvider {
  public name = 'MockProvider';
  public callCount = 0;
  public responses: Record<string, string> = {};

  constructor(responses: Record<string, string> = {}) {
    this.responses = responses;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    this.callCount++;
    let content = "Default mock answer";
    if (request.system?.toLowerCase().includes('synthesizer') || request.system?.toLowerCase().includes('executive synthesizer')) {
      content = this.responses['synthesizer'] || "Synthesizer response: The result is 15.";
    } else if (request.system?.toLowerCase().includes('expert critic') || request.system?.toLowerCase().includes('critic')) {
      content = this.responses['critic'] || "Critic evaluation response.";
    } else {
      content = this.responses['candidate'] || "Candidate answer from mock agent.";
    }
    
    return {
      content,
      modelUsed: request.model,
      provider: this.name
    };
  }

  async stream(request: AIRequest, onChunk: (chunk: string) => void): Promise<AIResponse> {
    const res = await this.generate(request);
    onChunk(res.content);
    return res;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async getModels(): Promise<string[]> {
    return ['mock-llama', 'mock-qwen', 'mock-gemma'];
  }

  getCapabilities(model: string): ModelCapabilities {
    return {
      multimodal: false,
      contextWindow: 2048,
      type: 'simulated'
    };
  }
}

async function runTests() {
  console.log('=============================================');
  console.log('   RUNNING AI COUNCIL INTEGRATION TESTS      ');
  console.log('=============================================');

  // TEST 1: Heuristic Router
  console.log('\n[Test 1] Testing Task Routing Heuristics...');
  const orchestrator = new Orchestrator();

  const mathTask = await orchestrator.analyzeTask('What is the integral of x^2 from 0 to 5?');
  assert.strictEqual(mathTask.taskType, 'Mathematics', 'Math keyword should route to Mathematics');

  const progTask = await orchestrator.analyzeTask('Write a Python function to quicksort an array.');
  assert.strictEqual(progTask.taskType, 'Programming', 'Coding keyword should route to Programming');

  const simpleTask = await orchestrator.analyzeTask('Hello, how is it going?');
  assert.strictEqual(simpleTask.taskType, 'Simple', 'Short greetings should route to Simple');

  const logicTask = await orchestrator.analyzeTask('If a tree falls in a forest and no one is around, does it make a sound?');
  assert.strictEqual(logicTask.taskType, 'Logic', 'Reasoning puzzles should route to Logic');

  console.log('✓ Test 1 Passed: Heuristic task routing classified correctly.');

  // TEST 2: Local Javascript Sandbox Execution
  console.log('\n[Test 2] Testing Safe Code Sandbox...');
  const safeCode = `
    const fib = (n) => n <= 1 ? n : fib(n-1) + fib(n-2);
    console.log(fib(7));
  `;
  const safeRes = await executeCode(safeCode);
  assert.strictEqual(safeRes.success, true, 'Safe math code should execute successfully');
  assert.strictEqual(safeRes.stdout.trim(), '13', 'Fibonacci(7) should print 13');

  // TEST 3: Sandbox Security Blocks
  console.log('\n[Test 3] Testing Sandbox Security Restrictions...');
  const unsafeCode = `
    const fs = require('fs');
    fs.writeFileSync('injected.txt', 'evil');
  `;
  const unsafeRes = await executeCode(unsafeCode);
  assert.strictEqual(unsafeRes.success, false, 'Unsafe imports must be blocked');
  assert.ok(unsafeRes.error?.includes('Security Check Failed') || unsafeRes.error?.includes('Blocked library'), 'Unsafe code should trigger security rejection');

  const unsafeES6Code = `
    import fs from 'fs';
    console.log(fs);
  `;
  const unsafeES6Res = await executeCode(unsafeES6Code);
  assert.strictEqual(unsafeES6Res.success, false, 'ES6 unsafe imports must be blocked');
  
  console.log('✓ Test 3 Passed: Security checks successfully blocked forbidden keywords.');

  // TEST 4: Full Multi-Agent Parallel Loop & Single/Multi/Deep/Auto Modes
  console.log('\n[Test 4] Testing Multi-Agent Orchestration & Modes...');
  const testOrchestrator = new Orchestrator();

  const mockProvider = new MockAIProvider({
    'candidate': 'Model answer text containing math.',
    'critic': 'The candidates agree on key calculations.',
    'synthesizer': 'Here is the final synthesized math answer: The result is 15.'
  });

  testOrchestrator.registerProvider('mock-llama', mockProvider);
  testOrchestrator.registerProvider('mock-qwen', mockProvider);
  testOrchestrator.registerProvider('mock-gemma', mockProvider);

  const config: OrchestratorConfig = {
    selectedModels: ['mock-llama', 'mock-qwen', 'mock-gemma'],
    agentCount: 3,
    councilMode: 'multi',
    sandboxEnabled: false
  };

  const result = await testOrchestrator.orchestrate(
    'Calculate the integral of x^2 from 0 to 3.',
    '',
    config
  );

  assert.ok(result.finalAnswer.includes('result is 15'), 'Synthesizer should output correct consensus');
  assert.strictEqual(result.stepLogs.length >= 3, true, 'Should contain analysis, parallel execution, critic, synthesizing steps');
  
  console.log('✓ Test 4 Passed: Multi-Agent pipeline executed successfully.');

  // TEST 5: Single Mode Flow
  console.log('\n[Test 5] Testing Single Mode Execution...');
  const singleConfig: OrchestratorConfig = {
    selectedModels: ['mock-llama'],
    councilMode: 'single'
  };
  const singleResult = await testOrchestrator.orchestrate('What is 2+2?', '', singleConfig);
  assert.strictEqual(singleResult.agents?.length, 1, 'Single mode should run exactly 1 agent');
  console.log('✓ Test 5 Passed: Single mode executed directly.');

  console.log('\n=============================================');
  console.log('   ALL INTEGRATION TESTS PASSED SUCCESSFULLY ');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('\n❌ Test execution failed with error:');
  console.error(err);
  process.exit(1);
});
