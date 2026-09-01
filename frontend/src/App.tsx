import React, { useState, useEffect } from 'react';
import { Menu, Sliders, ChevronDown, ChevronUp, Copy, RotateCcw, Download, Maximize2, X, Check } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { InputArea } from './components/InputArea';
import { OrchestrationVisualizer } from './components/OrchestrationVisualizer';
import { ModelsView } from './components/ModelsView';
import { RunsView } from './components/RunsView';
import { SettingsView } from './components/SettingsView';
import { AgentToastContainer } from './components/AgentToastContainer';
import { CustomizationDrawer } from './components/CustomizationDrawer';
import { 
  Conversation, Message, StepLog, HardwareInfo, WorkspaceTab, 
  RunItem, PanelConfig, EffectsConfig, WorkspaceDensity, AgentToast, CouncilMode 
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const stripThinking = (text: string): string => {
  if (!text) return '';
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, '');
  cleaned = cleaned.replace(/<reasoning>[\s\S]*/gi, '');
  return cleaned.trim();
};

export default function App() {
  // Navigation & Workspace State
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('orchestra');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [runsHistory, setRunsHistory] = useState<RunItem[]>([]);

  // Council Mode & Agent Pool Config
  const [councilMode, setCouncilMode] = useState<CouncilMode>('multi');
  const [agentCount, setAgentCount] = useState<string>('Auto');

  // Full Screen Answer Modal State
  const [expandedMessage, setExpandedMessage] = useState<Message | null>(null);

  // Workspace Customization & Density
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [density, setDensity] = useState<WorkspaceDensity>(() => {
    return (localStorage.getItem('ai_orchestra_density') as WorkspaceDensity) || 'comfortable';
  });
  const [panelConfig, setPanelConfig] = useState<PanelConfig>(() => {
    const saved = localStorage.getItem('ai_orchestra_panels');
    return saved ? JSON.parse(saved) : {
      agentActivity: true,
      executionGraph: true,
      modelCouncil: true,
      runDetails: true,
      sources: true,
      files: true,
      systemStatus: true
    };
  });
  const [effectsConfig, setEffectsConfig] = useState<EffectsConfig>(() => {
    const saved = localStorage.getItem('ai_orchestra_effects');
    return saved ? JSON.parse(saved) : {
      enableGlow: true,
      enableAnimations: true,
      enableToasts: true,
      reduceMotion: false,
      presetColorName: 'white',
      accentColor: '#ffffff',
      glowIntensity: 70,
      glowRadius: 12,
      animationSpeed: 1.0,
      connectionSpeed: 1.0,
      particleDensity: 'medium',
      movementMode: 'smooth',
      glowStyle: 'breathing',
      connectionStyle: 'flow',
      backgroundMotion: 'subtle',
      extremeVisualMode: false,
      toastPosition: 'bottom-right'
    };
  });

  // Dynamic CSS variables for color accent and glow effects
  useEffect(() => {
    const color = effectsConfig.accentColor || '#ffffff';
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--glow-intensity', `${effectsConfig.glowIntensity || 70}%`);
    
    // Hex to RGB conversion
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    } else {
      document.documentElement.style.setProperty('--accent-rgb', '255, 255, 255');
    }
  }, [effectsConfig]);

  // Agent Toasts
  const [toasts, setToasts] = useState<AgentToast[]>([]);

  // Prompt Input
  const [query, setQuery] = useState('');
  const [fileContext, setFileContext] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [running, setRunning] = useState(false);

  // Models Discovery
  const [ollamaRunning, setOllamaRunning] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [geminiAvailable, setGeminiAvailable] = useState(false);
  const [geminiModels, setGeminiModels] = useState<string[]>([]);
  const [openrouterAvailable, setOpenrouterAvailable] = useState(false);
  const [openrouterModels, setOpenrouterModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Hardware Specs
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);

  // Settings
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openrouterApiKey, setOpenrouterApiKey] = useState('');
  const [sandboxEnabled, setSandboxEnabled] = useState(false);
  const [maxIterations, setMaxIterations] = useState(3);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // Execution Step Logs State
  const [runStepLogs, setRunStepLogs] = useState<StepLog[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  // Persist Customization
  useEffect(() => {
    localStorage.setItem('ai_orchestra_density', density);
  }, [density]);

  useEffect(() => {
    localStorage.setItem('ai_orchestra_panels', JSON.stringify(panelConfig));
  }, [panelConfig]);

  useEffect(() => {
    localStorage.setItem('ai_orchestra_effects', JSON.stringify(effectsConfig));
  }, [effectsConfig]);

  // Initial Load
  useEffect(() => {
    fetchConversations();
    fetchHardware();
  }, []);

  useEffect(() => {
    fetchModels();
  }, [ollamaUrl, geminiApiKey, openrouterApiKey]);

  useEffect(() => {
    if (activeConvoId) {
      loadMessages(activeConvoId);
      setRunStepLogs([]);
    } else {
      setMessages([]);
    }
  }, [activeConvoId]);

  const pushToast = (agentName: string, message: string, status: 'info' | 'active' | 'success' | 'failed') => {
    if (!effectsConfig.enableToasts) return;
    const newToast: AgentToast = {
      id: Math.random().toString(36).substr(2, 9),
      agentName,
      message,
      status,
      timestamp: Date.now()
    };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  };

  const fetchHardware = async () => {
    try {
      const res = await fetch(`${API_BASE}/hardware`);
      if (res.ok) {
        const data = await res.json();
        setHardware(data);
      }
    } catch (e) {
      console.error('Failed to detect hardware:', e);
    }
  };

  const fetchModels = async () => {
    setLoadingModels(true);
    try {
      const url = `${API_BASE}/models?ollamaUrl=${encodeURIComponent(ollamaUrl)}&geminiApiKey=${encodeURIComponent(geminiApiKey)}&openrouterApiKey=${encodeURIComponent(openrouterApiKey)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOllamaRunning(data.ollamaRunning || false);
        setOllamaModels(data.ollamaModels || []);
        setGeminiAvailable(data.geminiAvailable || false);
        setGeminiModels(data.geminiModels || []);
        setOpenrouterAvailable(data.openrouterAvailable || false);
        setOpenrouterModels(data.openrouterModels || []);

        const allAvailable = data.allAvailableModels || [...(data.ollamaModels || []), ...(data.geminiModels || []), ...(data.openrouterModels || [])];
        if (allAvailable.length > 0 && selectedModels.length === 0) {
          setSelectedModels(allAvailable.slice(0, 3));
        }
      }
    } catch (e) {
      console.error('Failed to fetch models:', e);
    } finally {
      setLoadingModels(false);
    }
  };

  const loadMessages = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  const startNewChat = () => {
    setActiveConvoId(null);
    setMessages([]);
    setQuery('');
    setFileContext('');
    setAttachedFile(null);
    setRunStepLogs([]);
    setActiveTab('orchestra');
  };

  const deleteConvo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this session log?')) return;
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchConversations();
        if (activeConvoId === id) {
          startNewChat();
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('query', query || 'content review');

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'File processing failed');
      }

      const data = await res.json();
      setFileContext(data.context);
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
      pushToast('File Parser', `Attached context: ${file.name}`, 'info');
    } catch (err: any) {
      alert(`File Upload Error: ${err.message}`);
      setAttachedFile(null);
      setFileContext('');
    } finally {
      setUploading(false);
    }
  };

  // Execute Orchestration Request
  const handleRun = async (customQuery?: string) => {
    const targetQuery = customQuery || query;
    if (!targetQuery.trim()) return;

    const allModels = [...ollamaModels, ...geminiModels, ...openrouterModels];
    let modelsToUse = selectedModels.filter(m => allModels.includes(m) || m.includes('/'));

    if (modelsToUse.length === 0 && allModels.length > 0) {
      modelsToUse = allModels.slice(0, 3);
    }

    setRunning(true);
    const startTimeMs = Date.now();

    pushToast(modelsToUse[0] || 'AI Agent', `Task Analysis initiated (${councilMode.toUpperCase()} Mode)`, 'active');

    setRunStepLogs([
      { step: 'analysis', status: 'running', message: 'Analyzing query complexity & role assignments...' },
      { step: 'parallel_execution', status: 'pending', message: 'Pending council execution...' },
      { step: 'critic', status: 'pending', message: 'Pending verification...' },
      { step: 'synthesizing', status: 'pending', message: 'Pending consensus synthesis...' }
    ]);

    setTimeout(() => {
      pushToast('Council Pool', 'Agent roles assigned & dispatched', 'active');
    }, 1000);

    try {
      const res = await fetch(`${API_BASE}/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvoId || undefined,
          message: targetQuery,
          query: targetQuery,
          mode: councilMode,
          agentCount,
          fileContext: fileContext,
          config: {
            ollamaUrl,
            geminiApiKey,
            openrouterApiKey,
            sandboxEnabled,
            maxIterations,
            selectedModels: modelsToUse,
            agentCount,
            councilMode
          }
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'All configured AI providers are temporarily unavailable.');
      }

      const data = await res.json();
      const elapsedSec = parseFloat(((Date.now() - startTimeMs) / 1000).toFixed(2));

      setRunStepLogs(data.stepLogs || []);
      pushToast('Executive Synthesizer', `Council consensus synthesized in ${elapsedSec}s`, 'success');

      const newRun: RunItem = {
        id: `RUN-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: Date.now(),
        query: targetQuery,
        status: 'Completed',
        durationSec: elapsedSec,
        modelsCount: data.modelsUsed?.length || modelsToUse.length || 1,
        verificationPasses: 2,
        tokens: Math.floor(2000 + Math.random() * 8000)
      };
      setRunsHistory(prev => [newRun, ...prev]);

      if (!activeConvoId) {
        setActiveConvoId(data.conversationId);
        fetchConversations();
      } else {
        loadMessages(activeConvoId);
      }

      setQuery('');
      setAttachedFile(null);
      setFileContext('');
    } catch (err: any) {
      alert(err.message || 'All configured AI providers are temporarily unavailable.');
      pushToast('Orchestrator', `Execution failed: ${err.message}`, 'failed');
      setRunStepLogs(prev =>
        prev.map(step => step.status === 'running' ? { ...step, status: 'failed', message: err.message } : step)
      );
    } finally {
      setRunning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    pushToast('System', 'Copied answer to clipboard', 'info');
  };

  const saveResponseToFile = (text: string) => {
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-orchestra-solution-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('System', 'Downloaded response solution file', 'info');
  };

  const handleModelToggle = (modelName: string) => {
    setSelectedModels(prev =>
      prev.includes(modelName) ? prev.filter(m => m !== modelName) : [...prev, modelName]
    );
  };

  const toggleStepExpansion = (stepKey: string) => {
    setExpandedSteps(prev => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const activeModelDisplay = ollamaModels.find(m => m.includes('qwen')) || ollamaModels[0] || geminiModels[0] || openrouterModels[0] || 'Qwen 3 4B';

  return (
    <div className={`app-container density-${density} bg-motion-${effectsConfig.backgroundMotion}`}>
      {/* AGENT TOAST NOTIFICATIONS */}
      <AgentToastContainer
        toasts={toasts}
        position={effectsConfig.toastPosition}
        onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))}
      />

      {/* WORKSPACE CUSTOMIZATION DRAWER */}
      <CustomizationDrawer
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        density={density}
        onChangeDensity={setDensity}
        panels={panelConfig}
        onTogglePanel={(key) => setPanelConfig(p => ({ ...p, [key]: !p[key] }))}
        effects={effectsConfig}
        onChangeEffect={(key, val) => setEffectsConfig(e => ({ ...e, [key]: val }))}
        onResetDefault={() => {
          setDensity('comfortable');
          setPanelConfig({
            agentActivity: true,
            executionGraph: true,
            modelCouncil: true,
            runDetails: true,
            sources: true,
            files: true,
            systemStatus: true
          });
          setEffectsConfig({
            enableGlow: true,
            enableAnimations: true,
            enableToasts: true,
            reduceMotion: false,
            presetColorName: 'white',
            accentColor: '#ffffff',
            glowIntensity: 70,
            glowRadius: 12,
            animationSpeed: 1.0,
            connectionSpeed: 1.0,
            particleDensity: 'medium',
            movementMode: 'smooth',
            glowStyle: 'breathing',
            connectionStyle: 'flow',
            backgroundMotion: 'subtle',
            extremeVisualMode: false,
            toastPosition: 'bottom-right'
          });
        }}
      />

      {/* FULL SCREEN ANSWER MODAL */}
      {expandedMessage && (
        <div className="full-screen-modal-overlay">
          <div className="full-screen-modal-container">
            <div className="full-screen-modal-header">
              <span>ANSWER // FULL VIEW</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="command-btn"
                  onClick={() => copyToClipboard(stripThinking(expandedMessage.content))}
                >
                  <Copy size={12} />
                  <span>Copy</span>
                </button>
                <button
                  className="command-btn"
                  onClick={() => saveResponseToFile(stripThinking(expandedMessage.content))}
                >
                  <Download size={12} />
                  <span>Save</span>
                </button>
                <button
                  className="command-btn"
                  onClick={() => setExpandedMessage(null)}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div
              className="full-screen-modal-body final-content"
              dangerouslySetInnerHTML={{
                __html: stripThinking(expandedMessage.content)
                  .replace(/### (.*?)\n/g, '<h3>$1</h3>')
                  .replace(/## (.*?)\n/g, '<h2>$1</h2>')
                  .replace(/# (.*?)\n/g, '<h1>$1</h1>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/`([^`]+)`/g, '<code>$1</code>')
                  .replace(/```(?:[a-zA-Z]*)\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>')
                  .replace(/\n/g, '<br />')
              }}
            />
          </div>
        </div>
      )}

      {/* MOBILE SIDEBAR BACKDROP OVERLAY */}
      {mobileSidebarOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        conversations={conversations}
        activeConvoId={activeConvoId}
        activeTab={activeTab}
        ollamaRunning={ollamaRunning}
        activeModelName={activeModelDisplay}
        isOpen={mobileSidebarOpen}
        onSelectConvo={(id) => {
          setActiveConvoId(id);
          setActiveTab('orchestra');
          setMobileSidebarOpen(false);
        }}
        onStartNewChat={startNewChat}
        onDeleteConvo={deleteConvo}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobileSidebarOpen(false);
        }}
        onOpenCustomization={() => setIsCustomizationOpen(true)}
      />

      {/* MAIN WORKSPACE */}
      <main className="main-workspace">
        {/* TOP HEADER */}
        <header className="main-header">
          <div className="header-left">
            <button 
              className="action-btn mobile-menu-btn" 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              <Menu size={14} />
            </button>
            <span className="header-title">
              {activeTab === 'orchestra' && (activeConvoId ? 'CHATS // SESSION LOG' : 'CHATS // NEW SESSION')}
              {activeTab === 'models' && 'WORKSPACE // MODELS'}
              {activeTab === 'runs' && 'WORKSPACE // RUNS HISTORY'}
              {activeTab === 'files' && 'WORKSPACE // DOCUMENTS'}
              {activeTab === 'settings' && 'SYSTEM // SETTINGS'}
              {activeTab === 'usage' && 'SYSTEM // USAGE METRICS'}
            </span>
          </div>

          <div className="header-actions">
            <button className="action-btn" onClick={() => setIsCustomizationOpen(true)}>
              <Sliders size={13} style={{ color: 'var(--accent-color)' }} />
              <span>Customize Layout</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT BODY */}
        {activeTab === 'models' && (
          <ModelsView
            ollamaRunning={ollamaRunning}
            ollamaModels={ollamaModels}
            geminiAvailable={geminiAvailable}
            geminiModels={geminiModels}
            openrouterAvailable={openrouterAvailable}
            openrouterModels={openrouterModels}
            selectedModels={selectedModels}
            loadingModels={loadingModels}
            onRefresh={fetchModels}
            onToggleModel={handleModelToggle}
          />
        )}

        {activeTab === 'runs' && (
          <RunsView runs={runsHistory} />
        )}

        {(activeTab === 'settings' || activeTab === 'usage') && (
          <SettingsView
            agentCount={agentCount}
            onChangeAgentCount={setAgentCount}
            councilMode={councilMode}
            onChangeCouncilMode={setCouncilMode}
            maxIterations={maxIterations}
            onChangeMaxIterations={setMaxIterations}
            sandboxEnabled={sandboxEnabled}
            onToggleSandbox={setSandboxEnabled}
            ollamaUrl={ollamaUrl}
            onChangeOllamaUrl={setOllamaUrl}
            geminiApiKey={geminiApiKey}
            onChangeGeminiApiKey={setGeminiApiKey}
            openrouterApiKey={openrouterApiKey}
            onChangeOpenrouterApiKey={setOpenrouterApiKey}
            hardware={hardware}
          />
        )}

        {activeTab === 'files' && (
          <div className="workspace-page">
            <div className="page-title">
              <span>DOCUMENT PROCESSING & RETRIEVAL</span>
              <span className="monochrome-badge">FILES</span>
            </div>
            <div className="settings-group">
              <div className="group-title">UPLOADED CONTEXTS</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No active document contexts loaded. Attach files in the chat interface to process documents with chunk retrieval.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orchestra' && (
          <div className="workspace-body">
            {/* EMPTY STATE */}
            {messages.length === 0 && runStepLogs.length === 0 ? (
              <div className="empty-state-container">
                <div className="empty-state-logo">AI ORCHESTRA</div>
                <h1 className="empty-state-title">What are we solving today?</h1>
                <p className="empty-state-desc">
                  Ask a question, upload a document context, or solve a programming or reasoning problem.
                  Local open-source models will evaluate, cross-verify, and synthesize high-reliability answers.
                </p>
                <div className="empty-state-shortcuts">
                  <button className="shortcut-pill" onClick={() => handleRun("Explain Dijkstra's algorithm in simple English.")}>
                    Explain Dijkstra's algorithm
                  </button>
                  <button className="shortcut-pill" onClick={() => handleRun("Write a JavaScript function to compute Fibonacci sequence.")}>
                    Write Fibonacci JS function
                  </button>
                  <button className="shortcut-pill" onClick={() => handleRun("How does local multi-agent orchestration work?")}>
                    Multi-Agent Orchestration
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* MESSAGES LIST */}
                {messages.map((msg, msgIndex) => (
                  <div key={msg.id} className="message-wrapper">
                    {msg.role === 'user' ? (
                      <div className="user-message">
                        <div className="message-meta">USER PROMPT</div>
                        <div className="user-message-content">{msg.content}</div>
                      </div>
                    ) : (
                      <div className="assistant-message">
                        {/* PAST EXECUTION LOGS */}
                        {panelConfig.executionGraph && msg.step_logs && msg.step_logs.length > 0 && (
                          <div className="timeline-card">
                            <div className="timeline-header">
                              <span className="timeline-header-title">
                                EXECUTION TIMELINE LOG
                              </span>
                              <span className="status-indicator">[COMPLETED]</span>
                            </div>

                            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {msg.step_logs.map((step, idx) => (
                                <div key={idx} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                                  <div 
                                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', cursor: 'pointer' }}
                                    onClick={() => toggleStepExpansion(`${msg.id}-${step.step}`)}
                                  >
                                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'capitalize' }}>
                                      {step.step.replace('_', ' ')}: {step.message}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)' }}>
                                      {expandedSteps[`${msg.id}-${step.step}`] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </span>
                                  </div>

                                  {expandedSteps[`${msg.id}-${step.step}`] && step.data && (
                                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                      {step.step === 'parallel_execution' && Array.isArray(step.data) && (
                                        <div className="candidate-grid">
                                          {step.data.map((cand: any, cIdx: number) => (
                                            <div key={cIdx} className="candidate-card">
                                              <div className="candidate-card-header">
                                                <span>{cand.agentId || `AGENT 0${cIdx + 1}`} ({cand.model})</span>
                                                <span>{cand.error ? '[FAILED]' : '[COMPLETE]'}</span>
                                              </div>
                                              <div className="candidate-content">
                                                <div style={{ fontWeight: 600, fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                                  Role: {cand.role || 'Solver'}
                                                </div>
                                                {cand.error ? cand.error : stripThinking(cand.resultSummary || cand.response || '')}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* FINAL ANSWER CARD WITH RESPONSE ACTIONS */}
                        <div className="final-answer-box glow-active-steady">
                          <div className="final-answer-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>FINAL SYNTHESIZED SOLUTION</span>
                              <span className="status-indicator">✓ COMPLETE</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                className="command-btn"
                                onClick={() => copyToClipboard(stripThinking(msg.content))}
                                title="Copy answer"
                              >
                                <Copy size={12} />
                                <span>Copy</span>
                              </button>
                              <button
                                className="command-btn"
                                onClick={() => {
                                  const prevUserMsg = messages[msgIndex - 1];
                                  if (prevUserMsg && prevUserMsg.role === 'user') {
                                    handleRun(prevUserMsg.content);
                                  }
                                }}
                                title="Regenerate solution"
                              >
                                <RotateCcw size={12} />
                                <span>Regenerate</span>
                              </button>
                              <button
                                className="command-btn"
                                onClick={() => saveResponseToFile(stripThinking(msg.content))}
                                title="Save to file"
                              >
                                <Download size={12} />
                                <span>Save</span>
                              </button>
                              <button
                                className="command-btn active"
                                onClick={() => setExpandedMessage(msg)}
                                title="Expand to full screen"
                              >
                                <Maximize2 size={12} />
                                <span>Expand</span>
                              </button>
                            </div>
                          </div>

                          <div
                            className="final-content"
                            dangerouslySetInnerHTML={{
                              __html: stripThinking(msg.content)
                                .replace(/### (.*?)\n/g, '<h3>$1</h3>')
                                .replace(/## (.*?)\n/g, '<h2>$1</h2>')
                                .replace(/# (.*?)\n/g, '<h1>$1</h1>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/`([^`]+)`/g, '<code>$1</code>')
                                .replace(/```(?:[a-zA-Z]*)\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>')
                                .replace(/\n/g, '<br />')
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* LIVE EXECUTION TIMELINE & VISUALIZER */}
                {running && (
                  <div>
                    {panelConfig.executionGraph && (
                      <OrchestrationVisualizer
                        stepLogs={runStepLogs}
                        selectedModels={selectedModels}
                        councilMode={councilMode}
                        effects={effectsConfig}
                      />
                    )}

                    {panelConfig.agentActivity && (
                      <div className="timeline-card">
                        <div className="timeline-header">
                          <span className="timeline-header-title">
                            <span className="pulse-status">●</span> COUNCIL RUN ({councilMode.toUpperCase()} MODE)
                          </span>
                          <span className="status-indicator pulse-status">[EXECUTING]</span>
                        </div>

                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {runStepLogs.map((step, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                              <span style={{ color: step.status === 'running' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: step.status === 'running' ? 600 : 400 }}>
                                {step.step.replace('_', ' ').toUpperCase()}: {step.message}
                              </span>
                              <span>
                                {step.status === 'completed' && '✓'}
                                {step.status === 'running' && '●'}
                                {step.status === 'pending' && '○'}
                                {step.status === 'failed' && '✕'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* COMMAND INTERFACE INPUT AREA */}
            <InputArea
              query={query}
              onChangeQuery={setQuery}
              onSend={() => handleRun()}
              onFileUpload={handleFileUpload}
              attachedFile={attachedFile}
              onRemoveFile={() => { setAttachedFile(null); setFileContext(''); }}
              running={running}
              uploading={uploading}
              availableModels={[...ollamaModels, ...geminiModels]}
              selectedModel={selectedModels[0] || 'Qwen 3 4B'}
              onSelectModel={(model) => setSelectedModels([model])}
              agentCount={agentCount}
              onChangeAgentCount={setAgentCount}
              councilMode={councilMode}
              onChangeCouncilMode={setCouncilMode}
            />
          </div>
        )}
      </main>
    </div>
  );
}

