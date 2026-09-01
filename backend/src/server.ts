import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createConversation, listConversations, getMessages, saveMessage, deleteConversation, getConversation } from './database/db.js';
import { Orchestrator, OrchestratorConfig } from './orchestrator/Orchestrator.js';
import { ProviderRegistry } from './providers/ProviderRegistry.js';
import { parseFile, searchChunks } from './tools/FileProcessor.js';
import { detectHardware } from './tools/Hardware.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Multer memory storage configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// GET /api/models - Detects available local and cloud models
app.get('/api/models', async (req, res) => {
  const ollamaUrl = (req.query.ollamaUrl as string) || undefined;
  const geminiApiKey = (req.query.geminiApiKey as string) || undefined;
  const openrouterApiKey = (req.query.openrouterApiKey as string) || undefined;

  const registry = new ProviderRegistry({
    ollamaUrl,
    geminiApiKey,
    openrouterApiKey
  });

  const status = await registry.getStatus();

  res.json({
    ollamaRunning: status.ollamaAvailable,
    ollamaModels: status.ollamaModels,
    geminiAvailable: status.geminiAvailable,
    geminiModels: status.geminiModels,
    openrouterAvailable: status.openrouterAvailable,
    openrouterModels: status.openrouterModels,
    allAvailableModels: status.allAvailableModels,
    freeModels: status.freeModels
  });
});

// GET /api/hardware - Retrieve host specifications
app.get('/api/hardware', async (req, res) => {
  try {
    const hw = await detectHardware();
    res.json(hw);
  } catch (error: any) {
    res.status(500).json({ error: `Hardware detection failed: ${error.message}` });
  }
});

// GET /api/conversations - List all stored chats
app.get('/api/conversations', async (req, res) => {
  try {
    const list = await listConversations();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/conversations/:id/messages - Retrieve single chat logs
app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const messages = await getMessages(req.params.id);
    const parsedMessages = messages.map(m => ({
      ...m,
      models_used: m.models_used ? JSON.parse(m.models_used) : [],
      step_logs: m.step_logs ? JSON.parse(m.step_logs) : []
    }));
    res.json(parsedMessages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/conversations/:id - Remove a conversation
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    await deleteConversation(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload - Handle file parsing and TF-IDF semantic chunk retrieval
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }
  const query = req.body.query || '';

  try {
    const parsed = await parseFile(req.file.buffer, req.file.originalname, req.file.mimetype);
    const relevantChunks = searchChunks(parsed.chunks, query, 4);
    const contextText = relevantChunks.map(c => c.text).join('\n---\n');

    res.json({
      filename: parsed.filename,
      context: contextText,
      totalChunks: parsed.chunks.length,
      matchedChunks: relevantChunks.length
    });
  } catch (error: any) {
    res.status(500).json({ error: `File processing failed: ${error.message}` });
  }
});

// POST /api/orchestrate - Route & Run agent execution loop (supports SSE streaming)
app.post('/api/orchestrate', async (req, res) => {
  const body = req.body || {};
  const query = body.message || body.query;
  const fileContext = body.fileContext || '';
  const conversationId = body.conversationId;
  const isStream = req.query.stream === 'true' || body.stream === true || (req.headers.accept && req.headers.accept.includes('text/event-stream'));

  const mode = body.mode || body.config?.councilMode || 'auto';
  const agentCount = body.agentCount || body.config?.agentCount || 'Auto';

  const config: OrchestratorConfig = {
    ollamaUrl: body.config?.ollamaUrl,
    geminiApiKey: body.config?.geminiApiKey,
    openrouterApiKey: body.config?.openrouterApiKey,
    sandboxEnabled: body.config?.sandboxEnabled ?? false,
    maxIterations: body.config?.maxIterations ?? 3,
    selectedModels: body.config?.selectedModels || [],
    agentCount: agentCount,
    councilMode: mode
  };

  if (!query) {
    res.status(400).json({ error: 'Query or message is required' });
    return;
  }

  try {
    let convoId = conversationId;
    
    if (!convoId) {
      convoId = crypto.randomUUID();
      const title = query.length > 30 ? query.substring(0, 30) + '...' : query;
      await createConversation(convoId, title);
    } else {
      const existing = await getConversation(convoId);
      if (!existing) {
        const title = query.length > 30 ? query.substring(0, 30) + '...' : query;
        await createConversation(convoId, title);
      }
    }

    const userMsgId = crypto.randomUUID();
    await saveMessage({
      id: userMsgId,
      conversation_id: convoId,
      role: 'user',
      content: query,
      cost: 0
    });

    const orchestrator = new Orchestrator({
      ollamaUrl: config.ollamaUrl,
      geminiApiKey: config.geminiApiKey,
      openrouterApiKey: config.openrouterApiKey
    });

    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const result = await orchestrator.orchestrateStream(
        query,
        fileContext,
        config,
        (stepLog) => {
          res.write(`event: stepLog\ndata: ${JSON.stringify(stepLog)}\n\n`);
        },
        (chunk) => {
          res.write(`event: token\ndata: ${JSON.stringify({ chunk })}\n\n`);
        }
      );

      const assistantMsgId = crypto.randomUUID();
      await saveMessage({
        id: assistantMsgId,
        conversation_id: convoId,
        role: 'assistant',
        content: result.finalAnswer,
        models_used: JSON.stringify(result.modelsUsed),
        step_logs: JSON.stringify(result.stepLogs),
        cost: 0
      });

      res.write(`event: result\ndata: ${JSON.stringify({
        conversationId: convoId,
        messageId: assistantMsgId,
        finalAnswer: result.finalAnswer,
        agents: result.agents,
        stepLogs: result.stepLogs,
        modelsUsed: result.modelsUsed
      })}\n\n`);

      res.end();
    } else {
      const result = await orchestrator.orchestrate(query, fileContext, config);

      const assistantMsgId = crypto.randomUUID();
      await saveMessage({
        id: assistantMsgId,
        conversation_id: convoId,
        role: 'assistant',
        content: result.finalAnswer,
        models_used: JSON.stringify(result.modelsUsed),
        step_logs: JSON.stringify(result.stepLogs),
        cost: 0
      });

      res.json({
        conversationId: convoId,
        messageId: assistantMsgId,
        finalAnswer: result.finalAnswer,
        agents: result.agents,
        stepLogs: result.stepLogs,
        modelsUsed: result.modelsUsed
      });
    }
  } catch (error: any) {
    console.error('Orchestration REST endpoint failed:', error);
    const cleanErrorMessage = error.message?.includes('temporarily unavailable')
      ? 'All configured AI providers are temporarily unavailable.'
      : `Orchestration failed: ${error.message}`;

    if (isStream && res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: cleanErrorMessage })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: cleanErrorMessage });
    }
  }
});

// Start standalone server if run directly
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`AI Orchestra backend running on port ${port}`);
  });
}

export default app;
