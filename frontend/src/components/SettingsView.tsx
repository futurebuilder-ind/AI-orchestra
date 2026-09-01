import React from 'react';
import { HardwareInfo, CouncilMode } from '../types';

interface SettingsViewProps {
  agentCount: string;
  onChangeAgentCount: (count: string) => void;
  councilMode: CouncilMode;
  onChangeCouncilMode: (mode: CouncilMode) => void;
  maxIterations: number;
  onChangeMaxIterations: (iters: number) => void;
  sandboxEnabled: boolean;
  onToggleSandbox: (enabled: boolean) => void;
  ollamaUrl: string;
  onChangeOllamaUrl: (url: string) => void;
  geminiApiKey: string;
  onChangeGeminiApiKey: (key: string) => void;
  openrouterApiKey?: string;
  onChangeOpenrouterApiKey?: (key: string) => void;
  hardware: HardwareInfo | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  agentCount,
  onChangeAgentCount,
  councilMode,
  onChangeCouncilMode,
  maxIterations,
  onChangeMaxIterations,
  sandboxEnabled,
  onToggleSandbox,
  ollamaUrl,
  onChangeOllamaUrl,
  geminiApiKey,
  onChangeGeminiApiKey,
  openrouterApiKey = '',
  onChangeOpenrouterApiKey,
  hardware
}) => {
  return (
    <div className="workspace-page">
      <div className="page-title">
        <span>SYSTEM & COUNCIL SETTINGS</span>
        <span className="monochrome-badge">SETTINGS</span>
      </div>

      {/* GENERAL */}
      <div className="settings-group">
        <div className="group-title">GENERAL</div>
        
        <div className="form-row">
          <div>
            <div className="form-label">Interface Theme</div>
            <div className="form-sublabel">Monochrome dark mode active</div>
          </div>
          <span className="monochrome-badge">DARK MONOCHROME</span>
        </div>

        <div className="form-row" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
          <div>
            <div className="form-label">Language / Locale</div>
            <div className="form-sublabel">System default (English)</div>
          </div>
          <span className="monochrome-badge">EN-US</span>
        </div>
      </div>

      {/* COUNCIL MODE & REASONING */}
      <div className="settings-group">
        <div className="group-title">COUNCIL MODE & REASONING</div>

        <div className="form-row">
          <div>
            <div className="form-label">Council Execution Mode</div>
            <div className="form-sublabel">Select agent strategy (Single, Multi, Deep, Auto)</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(['single', 'multi', 'deep', 'auto'] as CouncilMode[]).map((mode) => (
              <button
                key={mode}
                className={`command-btn ${councilMode === mode ? 'active' : ''}`}
                style={{ textTransform: 'uppercase', padding: '4px 8px' }}
                onClick={() => onChangeCouncilMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
          <div>
            <div className="form-label">Active Agents Count</div>
            <div className="form-sublabel">Number of council agent runs (1 to 10 max)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="range"
              min={1}
              max={10}
              value={agentCount === 'Auto' ? 3 : parseInt(agentCount)}
              onChange={(e) => onChangeAgentCount(e.target.value)}
              className="monochrome-slider"
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, minWidth: '34px', textAlign: 'right' }}>
              {agentCount}
            </span>
          </div>
        </div>

        <div className="form-row" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
          <div>
            <div className="form-label">Max Refinement Loops</div>
            <div className="form-sublabel">Maximum autonomous critic iterations</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="range"
              min={1}
              max={5}
              value={maxIterations}
              onChange={(e) => onChangeMaxIterations(parseInt(e.target.value))}
              className="monochrome-slider"
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, minWidth: '20px', textAlign: 'right' }}>{maxIterations}</span>
          </div>
        </div>

        <div className="form-row" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
          <div>
            <div className="form-label">Local Code Sandbox</div>
            <div className="form-sublabel">Process-isolated Node.js execution sandbox</div>
          </div>
          <input
            type="checkbox"
            checked={sandboxEnabled}
            onChange={(e) => onToggleSandbox(e.target.checked)}
            className="monochrome-input"
            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
          />
        </div>
      </div>

      {/* MODEL ENDPOINTS */}
      <div className="settings-group">
        <div className="group-title">MODELS & ENDPOINTS</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label className="form-label">Ollama Host Endpoint (Local Development)</label>
          <input
            type="text"
            className="monochrome-input"
            value={ollamaUrl}
            onChange={(e) => onChangeOllamaUrl(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
          <label className="form-label">Gemini API Key (Cloud Provider)</label>
          <input
            type="password"
            className="monochrome-input"
            placeholder="Configured via Vercel env or enter key..."
            value={geminiApiKey}
            onChange={(e) => onChangeGeminiApiKey(e.target.value)}
          />
        </div>

        {onChangeOpenrouterApiKey && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
            <label className="form-label">OpenRouter API Key (Cloud / Free Tier)</label>
            <input
              type="password"
              className="monochrome-input"
              placeholder="Configured via Vercel env or enter key..."
              value={openrouterApiKey}
              onChange={(e) => onChangeOpenrouterApiKey(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* HARDWARE SPECIFICATIONS */}
      {hardware && (
        <div className="settings-group">
          <div className="group-title">SYSTEM HARDWARE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>MEMORY (RAM)</div>
              <div style={{ fontWeight: 600 }}>{hardware.totalRamGB} GB</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>CPU CORES</div>
              <div style={{ fontWeight: 600 }}>{hardware.cpuCores} Cores</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>GRAPHICS (GPU)</div>
              <div style={{ fontWeight: 600 }}>{hardware.gpuDetected ? `${hardware.gpuName} (${hardware.gpuVramGB}GB VRAM)` : 'CPU Fallback'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
