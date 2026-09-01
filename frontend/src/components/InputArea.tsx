import React, { useRef, useEffect, useState } from 'react';
import { Paperclip, X, Cpu, ArrowUp, Users, ChevronDown, Check, Sliders } from 'lucide-react';
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

  const [tempAgentCount, setTempAgentCount] = useState(agentCount);

  useEffect(() => {
    if (showAgentPopover) {
      setTempAgentCount(agentCount);
    }
  }, [showAgentPopover, agentCount]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
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

  const handleSelectAgentCount = (count: string) => {
    onChangeAgentCount(count);
    if (count === '1') {
      onChangeCouncilMode('single');
    } else if (['2', '3', '4'].includes(count)) {
      onChangeCouncilMode('multi');
    } else if (['5', '6', '7', '8', '9', '10'].includes(count)) {
      onChangeCouncilMode('deep');
    }
  };

  const getRolesPreview = (countStr: string) => {
    const num = countStr === 'Auto' ? 3 : parseInt(countStr);
    const pool = [
      'Solver (Primary Solution)',
      'Independent Solver (Parallel Baseline)',
      'Alternative Solver (Edge Case Approach)',
      'Critic & Adversarial Verifier',
      'Fact & Schema Checker',
      'Code Reviewer & Refiner',
      'Mathematical Verifier',
      'Edge Case Specialist',
      'Refinement Specialist',
      'Executive Synthesizer'
    ];
    return pool.slice(0, Math.min(num, pool.length));
  };

  return (
    <div className="input-container">
      {/* COMPACT PREMIUM COUNCIL MODE SEGMENTED CONTROL */}
      <div className="segmented-control-container">
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
            {councilMode === 'single' && '1 agent solves prompt directly for maximum execution speed.'}
            {councilMode === 'multi' && '2–4 parallel agents cross-verify logic and produce consensus.'}
            {councilMode === 'deep' && '5–10 specialized role agents execute with full verification queue.'}
          </span>

          <span className="dynamic-state-badge">
            {agentCount === 'Auto'
              ? `${councilMode.toUpperCase()} MODE • DYNAMIC ALLOCATION`
              : `${agentCount} AGENT${agentCount === '1' ? '' : 'S'} • PARALLEL POOL`}
          </span>
        </div>
      </div>

      <div className="input-box">
        {/* MULTILINE AUTO-RESIZING TEXTAREA */}
        <textarea
          ref={textareaRef}
          className="input-textarea"
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI Orchestra anything... (Press Enter to send, Shift + Enter for newline)"
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
                <span>{uploading ? 'Processing...' : '＋ Attach'}</span>
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

            <button className="command-btn" style={{ pointerEvents: 'none' }}>
              <Cpu size={12} />
              <span>Model: {selectedModel ? selectedModel : 'Auto'}</span>
            </button>

            {/* AGENTS ▼ COMPACT DROPDOWN TRIGGER */}
            <button
              className={`command-btn ${showAgentPopover ? 'active' : ''}`}
              onClick={() => setShowAgentPopover(true)}
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
                <span>RUNNING</span>
              </>
            ) : (
              <>
                <ArrowUp size={13} />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AGENT POPOVER SELECTION MODAL */}
      {showAgentPopover && (
        <div className="agent-popover-overlay" onClick={() => setShowAgentPopover(false)}>
          <div className="agent-popover-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={13} />
                <span>AGENTS SELECTION</span>
              </div>
              <button onClick={() => setShowAgentPopover(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>

            {/* AUTO MODE */}
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>AUTO MODE</span>
                <button
                  className={`command-btn ${tempAgentCount === 'Auto' ? 'active glow-active-steady' : ''}`}
                  onClick={() => setTempAgentCount('Auto')}
                  style={{ padding: '4px 12px', fontWeight: 700 }}
                >
                  {tempAgentCount === 'Auto' ? '● AUTO ACTIVE' : 'SELECT AUTO'}
                </button>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Intelligently determines agent count based on query complexity (Simple → 1, Normal → 2-3, Complex → 4-5, Deep → 5-10).
              </div>
            </div>

            {/* MANUAL AGENT COUNT SELECTOR GRID (1 TO 10) */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                MANUAL AGENT COUNT (1 – 10)
              </div>
              <div className="agent-count-grid">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((num) => {
                  let badgeLabel = 'SINGLE';
                  if (['2', '3', '4'].includes(num)) badgeLabel = 'MULTI';
                  if (parseInt(num) >= 5) badgeLabel = 'DEEP';

                  return (
                    <button
                      key={num}
                      className={`agent-num-btn ${tempAgentCount === num ? 'active glow-active-steady' : ''}`}
                      onClick={() => setTempAgentCount(num)}
                      title={`${num} Agent (${badgeLabel})`}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{num}</span>
                      <span style={{ fontSize: '0.55rem', opacity: 0.75, marginTop: '2px' }}>{badgeLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ROLES PREVIEW */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                ASSIGNED ROLES ({tempAgentCount === 'Auto' ? 'AUTO (3 AGENTS)' : `${tempAgentCount} AGENTS`})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                {getRolesPreview(tempAgentCount).map((role, idx) => (
                  <div key={idx} style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>AGENT 0{idx + 1}:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* APPLY */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="send-btn glow-active-steady"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => {
                  handleSelectAgentCount(tempAgentCount);
                  setShowAgentPopover(false);
                }}
              >
                <Check size={14} />
                <span>APPLY AGENT CONFIGURATION</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

