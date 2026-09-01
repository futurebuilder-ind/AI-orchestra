import React, { useState } from 'react';
import { StepLog, EffectsConfig, AgentRunDetails, CouncilMode } from '../types';
import { ChevronDown, ChevronUp, Cpu, Check, Activity, Clock, AlertTriangle, Layers, Minimize2, Maximize2 } from 'lucide-react';

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

  const activeAgentCount = agentPoolData.length || 1;

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
      {/* HEADER BAR WITH COLLAPSE TOGGLE */}
      <div className="orchestration-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={13} style={{ color: 'var(--accent-color)' }} />
          <span>LIVE ORCHESTRATION PIPELINE ({councilMode.toUpperCase()} MODE)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="status-indicator">
            {synthesisStatus === 'completed' ? '✓ SYNTHESIZED' : parallelStatus === 'running' ? '● EXECUTING' : '○ READY'}
          </span>
          <button
            className="command-btn collapse-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Orchestra' : 'Collapse Orchestra'}
          >
            {isCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            <span>{isCollapsed ? 'EXPAND ORCHESTRA' : 'COLLAPSE ORCHESTRA'}</span>
          </button>
        </div>
      </div>

      {/* COLLAPSED SUMMARY VIEW */}
      {isCollapsed ? (
        <div className="collapsed-orchestra-bar">
          <span className="collapsed-pill">ORCHESTRATION</span>
          <span className="collapsed-pill">✓ {activeAgentCount} AGENT{activeAgentCount === 1 ? '' : 'S'} ({councilMode.toUpperCase()})</span>
          {councilMode !== 'single' && <span className="collapsed-pill">✓ VERIFIED</span>}
          <span className="collapsed-pill">✓ SYNTHESIZED</span>
        </div>
      ) : (
        /* EXPANDED GRAPH VIEW */
        <div className="graph-container">
          
          {/* SINGLE MODE FLOW: USER -> ORCHESTRATOR -> MODEL -> FINAL ANSWER */}
          {councilMode === 'single' ? (
            <div className="single-mode-graph">
              <div className="graph-node-pill">
                <span>USER PROMPT</span>
              </div>
              <svg width="2" height="20" style={{ overflow: 'visible' }}>
                <line x1="1" y1="0" x2="1" y2="20" stroke="var(--border-medium)" strokeWidth="1" />
                {effects.enableAnimations && !effects.reduceMotion && (
                  <circle cx="1" cy="0" r="2.5" fill="var(--accent-color)">
                    <animate attributeName="cy" from="0" to="20" dur={particleDuration} repeatCount="indefinite" />
                  </circle>
                )}
              </svg>

              <div className={`graph-node-pill ${getNodeClass(analysisStatus)}`}>
                <span>ORCHESTRATOR ROUTER</span>
                <span>{analysisStatus === 'completed' ? '✓' : '●'}</span>
              </div>

              <svg width="2" height="20" style={{ overflow: 'visible' }}>
                <line x1="1" y1="0" x2="1" y2="20" stroke="var(--border-medium)" strokeWidth="1" />
                {effects.enableAnimations && !effects.reduceMotion && (
                  <circle cx="1" cy="0" r="2.5" fill="var(--accent-color)">
                    <animate attributeName="cy" from="0" to="20" dur={particleDuration} repeatCount="indefinite" />
                  </circle>
                )}
              </svg>

              <div className={`graph-node-pill single-model-node ${getNodeClass(parallelStatus)}`}>
                <Cpu size={14} />
                <span>{selectedModels[0] || 'Qwen 3 4B'} (1 AGENT)</span>
                <span>{parallelStatus === 'completed' ? '✓ COMPLETE' : '● EXECUTING'}</span>
              </div>

              <svg width="2" height="20" style={{ overflow: 'visible' }}>
                <line x1="1" y1="0" x2="1" y2="20" stroke="var(--border-medium)" strokeWidth="1" />
                {effects.enableAnimations && !effects.reduceMotion && (
                  <circle cx="1" cy="0" r="2.5" fill="var(--accent-color)">
                    <animate attributeName="cy" from="0" to="20" dur={particleDuration} repeatCount="indefinite" />
                  </circle>
                )}
              </svg>

              <div className={`graph-node-pill ${getNodeClass(synthesisStatus)}`}>
                <span>FINAL SYNTHESIZED ANSWER</span>
                <span>{synthesisStatus === 'completed' ? '✓' : '○'}</span>
              </div>
            </div>
          ) : (
            /* MULTI / DEEP MODE FLOW: ANALYSIS -> AGENT POOL -> CRITIC -> SYNTHESIS */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '8px' }}>
              
              {/* NODE 1: TASK ANALYSIS */}
              <div 
                className={`graph-node-pill ${getNodeClass(analysisStatus)}`}
                style={{ width: '260px', justifyContent: 'space-between' }}
              >
                <span>1. TASK ANALYSIS & ROUTING</span>
                <span>{analysisStatus === 'completed' ? '✓' : analysisStatus === 'running' ? '●' : '○'}</span>
              </div>

              {/* CONNECTING SVG */}
              <svg width="2" height="18" style={{ overflow: 'visible' }}>
                <line x1="1" y1="0" x2="1" y2="18" stroke="var(--border-medium)" strokeWidth="1" />
                {analysisStatus === 'running' && effects.enableAnimations && !effects.reduceMotion && (
                  <circle cx="1" cy="0" r="2.5" fill="var(--accent-color)">
                    <animate attributeName="cy" from="0" to="18" dur={particleDuration} repeatCount="indefinite" />
                  </circle>
                )}
              </svg>

              {/* AGENT COUNCIL POOL GRID */}
              <div className="agent-pool-grid">
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
                        {agent.status === 'completed' && '✓ READY'}
                        {agent.status === 'processing' && '● RUNNING'}
                        {agent.status === 'queued' && '○ QUEUED'}
                        {agent.status === 'failed' && '✕ FAILED'}
                      </span>
                    </div>

                    <div className="agent-model-name">
                      {agent.modelName}
                    </div>

                    <div className="agent-role-row">
                      <span>{agent.role}</span>
                      {agent.executionTimeSec && <span>{agent.executionTimeSec}s</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* EXPANDED DETAILS */}
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

              {/* CONNECTING SVG */}
              <svg width="2" height="18" style={{ overflow: 'visible' }}>
                <line x1="1" y1="0" x2="1" y2="18" stroke="var(--border-medium)" strokeWidth="1" />
                {parallelStatus === 'running' && effects.enableAnimations && !effects.reduceMotion && (
                  <circle cx="1" cy="0" r="2.5" fill="var(--accent-color)">
                    <animate attributeName="cy" from="0" to="18" dur={particleDuration} repeatCount="indefinite" />
                  </circle>
                )}
              </svg>

              {/* NODE 3: VERIFICATION & CRITIC */}
              <div
                className={`graph-node-pill ${getNodeClass(criticStatus)}`}
                style={{ width: '260px', justifyContent: 'space-between' }}
              >
                <span>3. VERIFICATION & CRITIC</span>
                <span>{criticStatus === 'completed' ? '✓' : criticStatus === 'running' ? '●' : '○'}</span>
              </div>

              {/* CONNECTING SVG */}
              <svg width="2" height="18" style={{ overflow: 'visible' }}>
                <line x1="1" y1="0" x2="1" y2="18" stroke="var(--border-medium)" strokeWidth="1" />
                {criticStatus === 'running' && effects.enableAnimations && !effects.reduceMotion && (
                  <circle cx="1" cy="0" r="2.5" fill="var(--accent-color)">
                    <animate attributeName="cy" from="0" to="18" dur={particleDuration} repeatCount="indefinite" />
                  </circle>
                )}
              </svg>

              {/* NODE 4: SYNTHESIS */}
              <div
                className={`graph-node-pill ${getNodeClass(synthesisStatus)}`}
                style={{ width: '260px', justifyContent: 'space-between' }}
              >
                <span>4. SYNTHESIS & CONSENSUS</span>
                <span>{synthesisStatus === 'completed' ? '✓' : synthesisStatus === 'running' ? '●' : '○'}</span>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};

