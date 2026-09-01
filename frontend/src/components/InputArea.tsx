import React, { useRef, useEffect, useState } from 'react';
import { Paperclip, X, Cpu, ArrowUp, Users, ChevronDown, Check, Sliders, Minus, Plus, Sparkles } from 'lucide-react';
import { CouncilMode } from '../types';

interface InputAreaProps {
  query: string;
  onChangeQuery: (q: string) => void;
  onSend: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attachedFile: { name: string; size: string } | null;
  onRemoveFile: () => void;
  running: boolean;
  uploading: boolean;
  availableModels: string[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
  agentCount: string;
  onChangeAgentCount: (count: string) => void;
  councilMode: CouncilMode;
  onChangeCouncilMode: (mode: CouncilMode) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  query,
  onChangeQuery,
  onSend,
  onFileUpload,
  attachedFile,
  onRemoveFile,
  running,
  uploading,
  availableModels,
  selectedModel,
  onSelectModel,
  agentCount,
  onChangeAgentCount,
  councilMode,
  onChangeCouncilMode
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [showModePopover, setShowModePopover] = useState(false);
  const [showModelPopover, setShowModelPopover] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [query]);

  // ENTER = Submit immediately, SHIFT + ENTER = Newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!running && !uploading && query.trim()) {
        onSend();
      }
    }
  };

  const handleSelectMode = (mode: CouncilMode) => {
    onChangeCouncilMode(mode);
    if (mode === 'single') {
      onChangeAgentCount('1');
    } else if (mode === 'multi') {
      if (agentCount !== 'Auto' && (parseInt(agentCount) < 2 || parseInt(agentCount) > 4)) {
        onChangeAgentCount('3');
      }
    } else if (mode === 'deep') {
      if (agentCount !== 'Auto' && parseInt(agentCount) < 5) {
        onChangeAgentCount('8');
      }
    }
    setShowModePopover(false);
  };

  const currentCountNum = agentCount === 'Auto' ? (councilMode === 'single' ? 1 : councilMode === 'multi' ? 3 : 8) : parseInt(agentCount);

  const handleIncrementAgents = () => {
    const next = Math.min(currentCountNum + 1, 10);
    onChangeAgentCount(next.toString());
    if (next === 1) onChangeCouncilMode('single');
    else if (next <= 4) onChangeCouncilMode('multi');
    else onChangeCouncilMode('deep');
  };

  const handleDecrementAgents = () => {
    const prev = Math.max(currentCountNum - 1, 1);
    onChangeAgentCount(prev.toString());
    if (prev === 1) onChangeCouncilMode('single');
    else if (prev <= 4) onChangeCouncilMode('multi');
    else onChangeCouncilMode('deep');
  };

  return (
    <div className="input-container">
      <div className="input-box">
        {/* MULTILINE AUTO-RESIZING TEXTAREA */}
        <textarea
          ref={textareaRef}
          className="input-textarea"
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI Orchestra... (Press Enter to send, Shift + Enter for newline)"
          disabled={running || uploading}
          rows={1}
        />

        {/* ATTACHED FILE BADGE */}
        {attachedFile && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="attached-badge">
              <Paperclip size={12} />
              <span>{attachedFile.name} ({attachedFile.size})</span>
              <button
                onClick={onRemoveFile}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* ACTION TOOLBAR */}
        <div className="input-toolbar">
          <div className="input-actions-left">
            {/* FILE ATTACHMENT */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <button className="command-btn" disabled={running || uploading}>
                <Paperclip size={12} />
                <span className="mobile-hide-text">{uploading ? 'Uploading...' : 'Attach'}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileUpload}
                disabled={running || uploading}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer'
                }}
                accept=".txt,.pdf,.csv,.json,.docx"
              />
            </div>

            {/* COMPACT MODEL SELECTOR TRIGGER */}
            <div style={{ position: 'relative' }}>
              <button
                className={`command-btn ${showModelPopover ? 'active' : ''}`}
                onClick={() => { setShowModelPopover(!showModelPopover); setShowModePopover(false); }}
                disabled={running || uploading}
              >
                <Cpu size={12} />
                <span className="model-label-text">{selectedModel ? selectedModel.split('/')[1] || selectedModel : 'Auto'}</span>
                <ChevronDown size={11} />
              </button>

              {/* MODEL POPOVER MENU */}
              {showModelPopover && (
                <div className="model-popover-menu" onClick={() => setShowModelPopover(false)}>
                  <div className="model-popover-header">SELECT PRIMARY MODEL</div>
                  <div className="model-popover-list">
                    <button
                      className={`model-popover-item ${!selectedModel || selectedModel === 'Auto' ? 'selected' : ''}`}
                      onClick={() => { onSelectModel('Auto'); setShowModelPopover(false); }}
                    >
                      <div className="model-item-title">Auto / Dynamic Routing</div>
                      <div className="model-item-sub">Selects best cloud/local model automatically</div>
                    </button>

                    {availableModels.map((model) => {
                      const isFree = model.includes('free') || model.includes('gemini') || model.includes('qwen');
                      const providerName = model.includes('/') ? 'OpenRouter Cloud' : model.includes('gemini') ? 'Google Gemini Cloud' : 'Local Ollama';
                      return (
                        <button
                          key={model}
                          className={`model-popover-item ${selectedModel === model ? 'selected' : ''}`}
                          onClick={() => { onSelectModel(model); setShowModelPopover(false); }}
                        >
                          <div className="model-item-top">
                            <span className="model-item-title">{model}</span>
                            {isFree && <span className="model-free-badge">FREE TIER</span>}
                          </div>
                          <div className="model-item-sub">{providerName} • Fast Latency</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* COMPACT MODE & AGENT SELECTOR TRIGGER (DESKTOP & MOBILE) */}
            <div style={{ position: 'relative' }}>
              <button
                className={`command-btn ${showModePopover ? 'active glow-active-steady' : ''}`}
                onClick={() => { setShowModePopover(!showModePopover); setShowModelPopover(false); }}
                disabled={running || uploading}
              >
                <Sparkles size={12} style={{ color: 'var(--accent-color)' }} />
                <span>MODE: <strong>{councilMode.toUpperCase()}</strong> ({currentCountNum})</span>
                <ChevronDown size={11} />
              </button>

              {/* MODE & AGENT POPOVER MENU */}
              {showModePopover && (
                <div className="mode-popover-menu" onClick={(e) => e.stopPropagation()}>
                  <div className="model-popover-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>ORCHESTRATION MODE & AGENTS</span>
                    <button onClick={() => setShowModePopover(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <X size={12} />
                    </button>
                  </div>

                  <div className="mode-popover-options">
                    {[
                      { mode: 'single', title: 'SINGLE', sub: '1 Agent · Direct & Fast Execution' },
                      { mode: 'multi', title: 'MULTI', sub: '2–4 Parallel Agents · Cross-Verification' },
                      { mode: 'deep', title: 'DEEP', sub: '5–10 Specialized Agents · Max Verification' }
                    ].map((item) => (
                      <button
                        key={item.mode}
                        className={`mode-option-btn ${councilMode === item.mode ? 'selected' : ''}`}
                        onClick={() => {
                          handleSelectMode(item.mode as CouncilMode);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>{item.title}</span>
                          {councilMode === item.mode && <Check size={12} style={{ color: 'var(--accent-color)' }} />}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.sub}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* AGENT STEPPER IN POPOVER */}
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '8px 10px', marginTop: '8px' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>PARALLEL AGENTS</span>
                      <span className="monochrome-badge">{currentCountNum} AGENTS</span>
                    </div>

                    <div className="popover-stepper-row">
                      <button
                        className="stepper-btn"
                        onClick={handleDecrementAgents}
                        disabled={currentCountNum <= 1}
                        style={{ padding: '4px 8px', border: '1px solid var(--border-medium)', borderRadius: '3px' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700 }}>
                        {agentCount === 'Auto' ? `AUTO (${currentCountNum})` : `${currentCountNum} AGENTS`}
                      </span>
                      <button
                        className="stepper-btn"
                        onClick={handleIncrementAgents}
                        disabled={currentCountNum >= 10}
                        style={{ padding: '4px 8px', border: '1px solid var(--border-medium)', borderRadius: '3px' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <button
                      className="send-btn glow-active-steady"
                      style={{ width: '100%', justifyContent: 'center', padding: '6px' }}
                      onClick={() => setShowModePopover(false)}
                    >
                      <Check size={12} />
                      <span>APPLY MODE</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            className="send-btn glow-active-steady"
            onClick={onSend}
            disabled={running || uploading || !query.trim()}
          >
            {running ? (
              <>
                <div className="spinner" />
                <span>STOP</span>
              </>
            ) : (
              <>
                <ArrowUp size={14} />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
