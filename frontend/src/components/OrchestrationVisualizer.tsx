import React, { useState } from 'react';
import { StepLog, EffectsConfig, AgentRunDetails, CouncilMode } from '../types';
import { ChevronDown, ChevronUp, Cpu, Check, Activity, Clock, AlertTriangle, Layers, Minimize2, Maximize2, X, Eye } from 'lucide-react';

interface OrchestrationVisualizerProps {
  stepLogs: StepLog[];
  selectedModels: string[];
  councilMode?: CouncilMode;
  effects?: EffectsConfig;
}

export const OrchestrationVisualizer: React.FC<OrchestrationVisualizerProps> = ({
  stepLogs,
  selectedModels,
  councilMode = 'multi',
  effects = {
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
  }
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentRunDetails | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAgentDrawer, setShowAgentDrawer] = useState(false);

  const getStepStatus = (stepName: string): 'pending' | 'running' | 'completed' | 'failed' => {
    const found = stepLogs.find((s) => s.step === stepName || (stepName === 'parallel' && s.step === 'parallel_execution'));
    return found ? found.status : 'pending';
  };

  const analysisStatus = getStepStatus('analysis');
  const parallelStatus = getStepStatus('parallel');
  const criticStatus = getStepStatus('critic');
  const synthesisStatus = getStepStatus('synthesizing');

  // Extract real agent pool data from parallel execution log step
  const parallelStep = stepLogs.find(s => s.step === 'parallel_execution');
  const agentPoolData: AgentRunDetails[] = parallelStep && Array.isArray(parallelStep.data)
    ? parallelStep.data.map((item: any, idx: number) => ({
        agentId: item.agentId || `AGENT 0${idx + 1}`,
        modelName: item.model || selectedModels[0] || 'Qwen 3 4B',
        role: item.role || (idx === 0 ? 'Solver' : idx === 1 ? 'Critic' : 'Independent Solver'),
        status: item.status || (parallelStatus === 'completed' ? 'completed' : parallelStatus === 'running' ? 'processing' : 'queued'),
        executionTimeSec: item.executionTimeSec,
        resultSummary: item.resultSummary || item.response,
        error: item.error
      }))
    : selectedModels.map((m, idx) => ({
        agentId: `AGENT 0${idx + 1}`,
        modelName: m,
        role: idx === 0 ? 'Solver' : idx === 1 ? 'Independent Solver' : 'Critic',
        status: parallelStatus === 'completed' ? 'completed' : parallelStatus === 'running' ? 'processing' : 'queued'
      }));

  const activeCount = agentPoolData.filter(a => a.status === 'processing').length;
  const completedCount = agentPoolData.filter(a => a.status === 'completed').length;
  const verifyingCount = criticStatus === 'running' ? 1 : 0;
  const queuedCount = agentPoolData.filter(a => a.status === 'queued').length;

  const getNodeClass = (status: 'pending' | 'running' | 'completed' | 'failed') => {
    if (status === 'running' && effects.enableGlow && !effects.reduceMotion) {
      return 'glow-active-pulse';
    }
    if (status === 'completed' && effects.enableGlow) {
      return 'glow-active-steady';
    }
    return '';
  };

  const particleDuration = `${(1.2 / (effects.connectionSpeed || 1.0)).toFixed(2)}s`;

  return (
    <div className={`orchestration-card ${effects.extremeVisualMode ? 'extreme-visual-mode' : ''}`}>
      {/* COMPACT OVERVIEW HEADER */}
      <div className="orchestration-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={13} style={{ color: 'var(--accent-color)' }} />
          <span>ORCHESTRATION // {councilMode.toUpperCase()} PIPELINE</span>
        </div>

        {/* AGENT SUMMARY BADGES */}
        <div className="orchestra-summary-badges">
          <span className="summary-pill active">● {activeCount || agentPoolData.length} ACTIVE</span>
          <span className="summary-pill completed">✓ {completedCount} COMPLETED</span>
          {verifyingCount > 0 && <span className="summary-pill verifying">● VERIFYING</span>}
          
          <button
            className="command-btn view-agents-btn"
            onClick={() => setShowAgentDrawer(true)}
            title="View detailed agent pool drawer"
          >
            <Eye size={12} />
            <span>View Agents ({agentPoolData.length})</span>
          </button>

          <button
            className="command-btn collapse-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Orchestra' : 'Collapse Orchestra'}
          >
            {isCollapsed ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
          </button>
        </div>
      </div>

      {/* COLLAPSED SUMMARY BAR */}
      {isCollapsed ? (
        <div className="collapsed-orchestra-bar">
          <span className="collapsed-pill">ORCHESTRATION ACTIVE</span>
          <span className="collapsed-pill">✓ {agentPoolData.length} AGENT{agentPoolData.length === 1 ? '' : 'S'}</span>
          {councilMode !== 'single' && <span className="collapsed-pill">✓ VERIFIED</span>}
          <span className="collapsed-pill">✓ CONSENSUS SYNTHESIZED</span>
        </div>
      ) : (
        /* EXPANDED PIPELINE GRAPH */
        <div className="graph-container">
          {councilMode === 'single' ? (
            <div className="single-mode-graph">
              <div className={`graph-node-pill ${getNodeClass(analysisStatus)}`}>
                <span>ORCHESTRATOR ROUTER</span>
                <span>{analysisStatus === 'completed' ? '✓' : '●'}</span>
              </div>

              <svg width="2" height="16" style={{ overflow: 'visible' }}>
                <line x1="1" y1="0" x2="1" y2="16" stroke="var(--border-medium)" strokeWidth="1" />
                {effects.enableAnimations && !effects.reduceMotion && (
                  <circle cx="1" cy="0" r="2" fill="var(--accent-color)">
                    <animate attributeName="cy" from="0" to="16" dur={particleDuration} repeatCount="indefinite" />
                  </circle>
                )}
              </svg>

              <div className={`graph-node-pill single-model-node ${getNodeClass(parallelStatus)}`}>
                <Cpu size={13} />
                <span>{selectedModels[0] || 'Qwen 3 4B'} (1 AGENT)</span>
                <span>{parallelStatus === 'completed' ? '✓ COMPLETE' : '● RUNNING'}</span>
              </div>

              <svg width="2" height="16" style={{ overflow: 'visible' }}>
                <line x1="1" y1="0" x2="1" y2="16" stroke="var(--border-medium)" strokeWidth="1" />
                {effects.enableAnimations && !effects.reduceMotion && (
                  <circle cx="1" cy="0" r="2" fill="var(--accent-color)">
                    <animate attributeName="cy" from="0" to="16" dur={particleDuration} repeatCount="indefinite" />
                  </circle>
                )}
              </svg>

              <div className={`graph-node-pill ${getNodeClass(synthesisStatus)}`}>
                <span>FINAL SOLUTION</span>
                <span>{synthesisStatus === 'completed' ? '✓' : '○'}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '6px' }}>
              {/* STAGE 1: ROUTER */}
              <div className={`graph-node-pill ${getNodeClass(analysisStatus)}`} style={{ width: '240px', justifyContent: 'space-between' }}>
                <span>1. ROUTER & ANALYSIS</span>
                <span>{analysisStatus === 'completed' ? '✓' : analysisStatus === 'running' ? '●' : '○'}</span>
              </div>

              <svg width="2" height="14" style={{ overflow: 'visible' }}>
                <line x1="1" y1="0" x2="1" y2="14" stroke="var(--border-medium)" strokeWidth="1" />
              </svg>

              {/* STAGE 2: PARALLEL AGENTS POOL OVERVIEW */}
              <div className={`graph-node-pill ${getNodeClass(parallelStatus)}`} style={{ width: '280px', justifyContent: 'space-between' }}>
                <span>2. PARALLEL AGENT POOL ({agentPoolData.length} AGENTS)</span>
                <span>{parallelStatus === 'completed' ? '✓' : parallelStatus === 'running' ? '●' : '○'}</span>
              </div>

              <svg width="2" height="14" style={{ overflow: 'visible' }}>
                <line x1="1" y1="0" x2="1" y2="14" stroke="var(--border-medium)" strokeWidth="1" />
              </svg>

              {/* STAGE 3: CRITIC */}
              <div className={`graph-node-pill ${getNodeClass(criticStatus)}`} style={{ width: '240px', justifyContent: 'space-between' }}>
                <span>3. VERIFICATION & CRITIC</span>
                <span>{criticStatus === 'completed' ? '✓' : criticStatus === 'running' ? '●' : '○'}</span>
              </div>

              <svg width="2" height="14" style={{ overflow: 'visible' }}>
                <line x1="1" y1="0" x2="1" y2="14" stroke="var(--border-medium)" strokeWidth="1" />
              </svg>

              {/* STAGE 4: SYNTHESIS */}
              <div className={`graph-node-pill ${getNodeClass(synthesisStatus)}`} style={{ width: '240px', justifyContent: 'space-between' }}>
                <span>4. SYNTHESIS CONSENSUS</span>
                <span>{synthesisStatus === 'completed' ? '✓' : synthesisStatus === 'running' ? '●' : '○'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AGENT POOL DRAWER MODAL */}
      {showAgentDrawer && (
        <div className="agent-popover-overlay" onClick={() => setShowAgentDrawer(false)}>
          <div className="agent-drawer-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={14} style={{ color: 'var(--accent-color)' }} />
                <span>AGENT COUNCIL POOL DETAILS ({agentPoolData.length} AGENTS)</span>
              </div>
              <button onClick={() => setShowAgentDrawer(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div className="agent-drawer-grid">
              {agentPoolData.map((agent, idx) => (
                <div
                  key={idx}
                  className={`agent-node-card node-status-${agent.status} ${
                    agent.status === 'processing' ? 'glow-active-pulse' : agent.status === 'completed' ? 'glow-active-steady' : ''
                  }`}
                  onClick={() => setSelectedAgent(selectedAgent?.agentId === agent.agentId ? null : agent)}
                >
                  <div className="agent-card-header">
                    <span>{agent.agentId}</span>
                    <span className="agent-status-label">
                      {agent.status === 'completed' && '✓ COMPLETED'}
                      {agent.status === 'processing' && '● RUNNING'}
                      {agent.status === 'queued' && '○ QUEUED'}
                      {agent.status === 'failed' && '✕ FAILED'}
                    </span>
                  </div>

                  <div className="agent-model-name">
                    {agent.modelName}
                  </div>

                  <div className="agent-role-row">
                    <span>Role: {agent.role}</span>
                    {agent.executionTimeSec && <span>{agent.executionTimeSec}s</span>}
                  </div>

                  {agent.resultSummary && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {agent.resultSummary.substring(0, 70)}...
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* EXPANDED INDIVIDUAL AGENT DETAIL */}
            {selectedAgent && (
              <div className="agent-detail-popdown">
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700 }}>{selectedAgent.agentId} — {selectedAgent.modelName} ({selectedAgent.role})</span>
                  <button onClick={() => setSelectedAgent(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {selectedAgent.error ? `Error: ${selectedAgent.error}` : selectedAgent.resultSummary || 'Agent output summary generated...'}
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="command-btn active"
                onClick={() => setShowAgentDrawer(false)}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
