import React, { useRef, useEffect, useState } from 'react';
import { Paperclip, X, Cpu, ArrowUp, Users, ChevronDown, Check, Sliders, Minus, Plus, Zap, Layers, Sparkles } from 'lucide-react';
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
  
  const [showAgentPopover, setShowAgentPopover] = useState(false);
  const [showModelPopover, setShowModelPopover] = useState(false);
  const [showMobileModeSheet, setShowMobileModeSheet] = useState(false);

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
      {/* DESKTOP MODE SELECTOR BAR */}
      <div className="segmented-control-container desktop-only-controls">
        <div className="segmented-control">
          <button
            className={`segmented-btn ${councilMode === 'single' ? 'active' : ''}`}
            onClick={() => handleSelectMode('single')}
            disabled={running || uploading}
          >
            <span className="segmented-title">SINGLE</span>
            <span className="segmented-sub">1 AGENT</span>
          </button>

          <button
            className={`segmented-btn ${councilMode === 'multi' ? 'active' : ''}`}
            onClick={() => handleSelectMode('multi')}
            disabled={running || uploading}
          >
            <span className="segmented-title">MULTI</span>
            <span className="segmented-sub">2–4 AGENTS</span>
          </button>

          <button
            className={`segmented-btn ${councilMode === 'deep' ? 'active' : ''}`}
            onClick={() => handleSelectMode('deep')}
            disabled={running || uploading}
          >
            <span className="segmented-title">DEEP</span>
            <span className="segmented-sub">5–10 AGENTS</span>
          </button>
        </div>

        <div className="council-context-bar">
          <span className="context-desc">
            {councilMode === 'single' && '1 agent · direct execution'}
            {councilMode === 'multi' && '2–4 agents · cross-check'}
            {councilMode === 'deep' && '5–10 agents · maximum verification'}
          </span>

          {/* DESKTOP STEPPER */}
          <div className="compact-stepper-control">
            <button
              className="stepper-btn"
              onClick={handleDecrementAgents}
              disabled={running || uploading || currentCountNum <= 1}
              title="Decrease agent count"
            >
              <Minus size={10} />
            </button>

            <span className="stepper-value">
              {agentCount === 'Auto' ? `AUTO (${currentCountNum})` : `${currentCountNum} AGENTS`}
            </span>

            <button
              className="stepper-btn"
              onClick={handleIncrementAgents}
              disabled={running || uploading || currentCountNum >= 10}
              title="Increase agent count"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE COMPACT CHIP TOOLBAR TRIGGER */}
      <div className="mobile-only-mode-bar">
        <button
          className="mobile-mode-chip-btn"
          onClick={() => setShowMobileModeSheet(true)}
          disabled={running || uploading}
        >
          <Sparkles size={11} style={{ color: 'var(--accent-color)' }} />
          <span>MODE: <strong>{councilMode.toUpperCase()}</strong> ({currentCountNum})</span>
          <ChevronDown size={11} />
        </button>
      </div>

      <div className="input-box">
        {/* MULTILINE AUTO-RESIZING TEXTAREA */}
        <textarea
          ref={textareaRef}
          className="input-textarea"
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI Orchestra..."
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

            {/* COMPACT MODEL SELECTOR DROPDOWN TRIGGER */}
            <div style={{ position: 'relative' }}>
              <button
                className={`command-btn ${showModelPopover ? 'active' : ''}`}
                onClick={() => setShowModelPopover(!showModelPopover)}
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

            {/* AGENTS CONFIG TRIGGER (DESKTOP) */}
            <button
              className={`command-btn desktop-only-inline ${showAgentPopover ? 'active' : ''}`}
              onClick={() => setShowAgentPopover(!showAgentPopover)}
              disabled={running || uploading}
            >
              <Users size={12} />
              <span>AGENTS: {agentCount.toUpperCase()}</span>
              <ChevronDown size={11} />
            </button>
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

      {/* MOBILE BOTTOM SHEET FOR MODE & AGENT SELECTOR */}
      {showMobileModeSheet && (
        <div className="agent-popover-overlay" onClick={() => setShowMobileModeSheet(false)}>
          <div className="mobile-bottom-sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle-bar" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={14} style={{ color: 'var(--accent-color)' }} />
                <span>ORCHESTRATION MODE & AGENTS</span>
              </div>
              <button onClick={() => setShowMobileModeSheet(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* MODE OPTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              {[
                { mode: 'single', title: 'SINGLE', sub: '1 Agent · Direct & Fast Execution' },
                { mode: 'multi', title: 'MULTI', sub: '2–4 Parallel Agents · Cross-Verification' },
                { mode: 'deep', title: 'DEEP', sub: '5–10 Specialized Role Agents · Maximum Security' }
              ].map((item) => (
                <button
                  key={item.mode}
                  className={`mobile-sheet-mode-btn ${councilMode === item.mode ? 'selected' : ''}`}
                  onClick={() => {
                    handleSelectMode(item.mode as CouncilMode);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.title}</span>
                    {councilMode === item.mode && <Check size={14} style={{ color: 'var(--accent-color)' }} />}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {item.sub}
                  </div>
                </button>
              ))}
            </div>

            {/* AGENT STEPPER ON MOBILE */}
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '14px', marginTop: '14px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>MANUAL AGENT COUNT</span>
                <span className="monochrome-badge">{currentCountNum} ACTIVE</span>
              </div>
              <div className="mobile-stepper-row">
                <button
                  className="mobile-stepper-btn"
                  onClick={handleDecrementAgents}
                  disabled={currentCountNum <= 1}
                >
                  <Minus size={14} />
                </button>
                <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {agentCount === 'Auto' ? `AUTO (${currentCountNum})` : `${currentCountNum} AGENTS`}
                </span>
                <button
                  className="mobile-stepper-btn"
                  onClick={handleIncrementAgents}
                  disabled={currentCountNum >= 10}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* APPLY */}
            <div style={{ marginTop: '16px' }}>
              <button
                className="send-btn glow-active-steady"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', minHeight: '44px' }}
                onClick={() => setShowMobileModeSheet(false)}
              >
                <Check size={14} />
                <span>APPLY & CLOSE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AGENT POPOVER MODAL (DESKTOP) */}
      {showAgentPopover && (
        <div className="agent-popover-overlay" onClick={() => setShowAgentPopover(false)}>
          <div className="agent-popover-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={13} style={{ color: 'var(--accent-color)' }} />
                <span>COUNCIL AGENT POOL CONFIGURATION</span>
              </div>
              <button onClick={() => setShowAgentPopover(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>

            {/* MANUAL AGENT COUNT GRID */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                PARALLEL AGENTS (1 – 10)
              </div>
              <div className="agent-count-grid">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((num) => {
                  let badgeLabel = 'SINGLE';
                  if (['2', '3', '4'].includes(num)) badgeLabel = 'MULTI';
                  if (parseInt(num) >= 5) badgeLabel = 'DEEP';

                  return (
                    <button
                      key={num}
                      className={`agent-num-btn ${agentCount === num ? 'active glow-active-steady' : ''}`}
                      onClick={() => {
                        onChangeAgentCount(num);
                        if (num === '1') onChangeCouncilMode('single');
                        else if (['2', '3', '4'].includes(num)) onChangeCouncilMode('multi');
                        else onChangeCouncilMode('deep');
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{num}</span>
                      <span style={{ fontSize: '0.55rem', opacity: 0.75, marginTop: '2px' }}>{badgeLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="send-btn glow-active-steady"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => setShowAgentPopover(false)}
              >
                <Check size={14} />
                <span>APPLY AGENT COUNT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
