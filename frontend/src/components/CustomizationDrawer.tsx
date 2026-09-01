import React from 'react';
import { 
  PanelConfig, EffectsConfig, WorkspaceDensity, PresetColor, 
  MovementMode, GlowStyle, ConnectionStyle, BackgroundMotion, ToastPosition 
} from '../types';
import { X, Sliders, Check, Zap, Sparkles, Eye, Palette } from 'lucide-react';

interface CustomizationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  density: WorkspaceDensity;
  onChangeDensity: (density: WorkspaceDensity) => void;
  panels: PanelConfig;
  onTogglePanel: (key: keyof PanelConfig) => void;
  effects: EffectsConfig;
  onChangeEffect: (key: keyof EffectsConfig, value: any) => void;
  onResetDefault: () => void;
}

const PRESET_COLORS: Array<{ name: PresetColor; hex: string; label: string }> = [
  { name: 'white', hex: '#ffffff', label: 'Monochrome White' },
  { name: 'blue', hex: '#3b82f6', label: 'Command Blue' },
  { name: 'purple', hex: '#a855f7', label: 'Deep Purple' },
  { name: 'cyan', hex: '#06b6d4', label: 'Electric Cyan' },
  { name: 'green', hex: '#10b981', label: 'Matrix Green' },
  { name: 'orange', hex: '#f97316', label: 'Amber Orange' },
  { name: 'red', hex: '#ef4444', label: 'Warning Red' }
];

export const CustomizationDrawer: React.FC<CustomizationDrawerProps> = ({
  isOpen,
  onClose,
  density,
  onChangeDensity,
  panels,
  onTogglePanel,
  effects,
  onChangeEffect,
  onResetDefault
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window customization-drawer-window" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={14} style={{ color: 'var(--accent-color)' }} />
            <span>CUSTOMIZE LAYOUT & GLOW SYSTEM</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div className="drawer-scroll-body">
          {/* EXTREME VISUAL MODE BANNER TOGGLE */}
          <div className={`extreme-mode-banner ${effects.extremeVisualMode ? 'active' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={16} style={{ color: effects.extremeVisualMode ? 'var(--accent-color)' : 'var(--text-muted)' }} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>EXTREME VISUAL MODE</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Unlocks node halos, streaming particles, active node pulses, and ambient background grid.
                </div>
              </div>
            </div>
            <button
              className={`command-btn ${effects.extremeVisualMode ? 'active glow-active-steady' : ''}`}
              onClick={() => onChangeEffect('extremeVisualMode', !effects.extremeVisualMode)}
              style={{ fontWeight: 700, padding: '6px 12px' }}
            >
              {effects.extremeVisualMode ? '● ENABLED' : 'ENABLE'}
            </button>
          </div>

          {/* ACCENT & ANIMATION COLOR PRESETS */}
          <div style={{ marginBottom: '16px' }}>
            <div className="group-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Palette size={12} />
              <span>ACCENT & GLOW COLOR</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  className={`color-preset-btn ${(effects.presetColorName === preset.name || (effects as any).colorPreset === preset.name) ? 'active' : ''}`}
                  onClick={() => {
                    onChangeEffect('presetColorName', preset.name);
                    onChangeEffect('colorPreset', preset.name);
                    onChangeEffect('accentColor', preset.hex);
                  }}
                  aria-label={`Select ${preset.label} theme`}
                >
                  <span className="color-dot" style={{ backgroundColor: preset.hex }} />
                  <span style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* GLOW STYLE (NONE, PULSE, BREATHING, FLOW, SCAN, ORBIT, AURORA) */}
          <div style={{ marginBottom: '16px' }}>
            <div className="group-title" style={{ marginBottom: '6px' }}>GLOW ANIMATION STYLE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {(['none', 'breathing', 'pulse', 'flow', 'scan', 'orbit', 'aurora'] as GlowStyle[]).map((g) => (
                <button
                  key={g}
                  className={`command-btn ${(effects.glowStyle || 'breathing') === g ? 'active' : ''}`}
                  style={{ fontSize: '0.68rem', textTransform: 'uppercase', justifyContent: 'center', padding: '6px' }}
                  onClick={() => onChangeEffect('glowStyle', g)}
                >
                  ● {g}
                </button>
              ))}
            </div>
          </div>

          {/* GLOW INTENSITY & SPEED SLIDERS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', background: 'var(--bg-base)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                GLOW INTENSITY ({effects.glowIntensity || 70}%)
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={effects.glowIntensity || 70}
                onChange={(e) => onChangeEffect('glowIntensity', parseInt(e.target.value))}
                className="monochrome-slider"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                ANIMATION SPEED ({(effects.animationSpeed || 1.0).toFixed(1)}x)
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={effects.animationSpeed || 1.0}
                onChange={(e) => onChangeEffect('animationSpeed', parseFloat(e.target.value))}
                className="monochrome-slider"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* BACKGROUND MOTION & WORKSPACE DENSITY */}
          <div style={{ marginBottom: '16px' }}>
            <div className="group-title" style={{ marginBottom: '6px' }}>LAYOUT DENSITY</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {(['compact', 'comfortable', 'spacious'] as WorkspaceDensity[]).map((d) => (
                <button
                  key={d}
                  className={`command-btn ${density === d ? 'active' : ''}`}
                  style={{ justifyContent: 'center', padding: '6px', textTransform: 'capitalize' }}
                  onClick={() => onChangeDensity(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* VISIBLE DASHBOARD PANELS */}
          <div style={{ marginBottom: '16px' }}>
            <div className="group-title" style={{ marginBottom: '8px' }}>VISIBLE DASHBOARD PANELS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {[
                { key: 'agentActivity', label: 'Agent Activity Log' },
                { key: 'executionGraph', label: 'Live Execution Graph' },
                { key: 'modelCouncil', label: 'Model Council Pool' },
                { key: 'runDetails', label: 'Run Execution Details' },
                { key: 'sources', label: 'Web Search Sources' },
                { key: 'files', label: 'Attached Context Files' },
                { key: 'systemStatus', label: 'System Hardware Status' }
              ].map(({ key, label }) => (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem',
                    padding: '6px 8px',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={panels[key as keyof PanelConfig]}
                    onChange={() => onTogglePanel(key as keyof PanelConfig)}
                    className="monochrome-input"
                    style={{ width: '13px', height: '13px', cursor: 'pointer' }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '10px' }}>
          <button className="command-btn" onClick={onResetDefault}>
            Restore Defaults
          </button>
          <button className="send-btn glow-active-steady" onClick={onClose}>
            <Check size={12} />
            <span>Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
