import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface ModelsViewProps {
  ollamaRunning: boolean;
  ollamaModels: string[];
  geminiAvailable: boolean;
  geminiModels: string[];
  openrouterAvailable?: boolean;
  openrouterModels?: string[];
  selectedModels: string[];
  loadingModels: boolean;
  onRefresh: () => void;
  onToggleModel: (model: string) => void;
}

export const ModelsView: React.FC<ModelsViewProps> = ({
  ollamaRunning,
  ollamaModels,
  geminiAvailable,
  geminiModels,
  openrouterAvailable = false,
  openrouterModels = [],
  selectedModels,
  loadingModels,
  onRefresh,
  onToggleModel
}) => {
  return (
    <div className="workspace-page">
      <div className="page-title">
        <span>MODELS INFRASTRUCTURE</span>
        <button className="action-btn" onClick={onRefresh} disabled={loadingModels}>
          <RefreshCw size={12} className={loadingModels ? 'spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* CLOUD PROVIDERS SECTION */}
      <div className="settings-group">
        <div className="group-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>CLOUD AI PROVIDERS (GEMINI & OPENROUTER)</span>
          <span className="monochrome-badge">
            {geminiAvailable || openrouterAvailable ? 'CLOUD ACTIVE' : 'KEY CONFIGURED / ENV'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...geminiModels, ...openrouterModels].map((model) => (
            <div
              key={model}
              className={`model-card-item ${selectedModels.includes(model) ? 'selected' : ''}`}
              onClick={() => onToggleModel(model)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model)}
                  onChange={() => {}}
                  className="monochrome-input"
                  style={{ cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{model}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {model.includes('gemini') ? 'Google Cloud API • Free Tier Support' : 'OpenRouter API • Free Model Tier'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="monochrome-badge">CLOUD</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  AVAILABLE
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LOCAL MODELS SECTION (DEV) */}
      <div className="settings-group">
        <div className="group-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>LOCAL ENGINE MODELS (DEVELOPMENT)</span>
          <span className="monochrome-badge">{ollamaRunning ? 'OLLAMA ACTIVE' : 'OLLAMA OFFLINE'}</span>
        </div>

        {!ollamaRunning ? (
          <div style={{ padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Ollama is optional for local development (http://localhost:11434). Not required for Vercel production deployment.
          </div>
        ) : ollamaModels.length === 0 ? (
          <div style={{ padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            No local models discovered. Pull a model via CLI e.g. <code>ollama pull qwen3:4b</code>.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ollamaModels.map((model) => (
              <div
                key={model}
                className={`model-card-item ${selectedModels.includes(model) ? 'selected' : ''}`}
                onClick={() => onToggleModel(model)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model)}
                    onChange={() => {}}
                    className="monochrome-input"
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{model}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Local Host • Local Execution
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="monochrome-badge">LOCAL</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    READY
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
