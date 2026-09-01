import React from 'react';
import { RunItem } from '../types';

interface RunsViewProps {
  runs: RunItem[];
}

export const RunsView: React.FC<RunsViewProps> = ({ runs }) => {
  const sampleRuns: RunItem[] = runs.length > 0 ? runs : [
    {
      id: 'RUN-1842',
      timestamp: Date.now() - 3600000,
      query: "Explain Dijkstra's algorithm in very simple English.",
      status: 'Completed',
      durationSec: 8.42,
      modelsCount: 1,
      verificationPasses: 2,
      tokens: 12482
    },
    {
      id: 'RUN-1841',
      timestamp: Date.now() - 7200000,
      query: "Write a JavaScript function to solve the Fibonacci sequence.",
      status: 'Completed',
      durationSec: 4.15,
      modelsCount: 2,
      verificationPasses: 1,
      tokens: 6140
    }
  ];

  return (
    <div className="workspace-page">
      <div className="page-title">
        <span>EXECUTION RUNS LOG</span>
        <span className="monochrome-badge">{sampleRuns.length} RUNS</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sampleRuns.map((run) => (
          <div key={run.id} className="settings-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem' }}>
                {run.id}
              </div>
              <span className="monochrome-badge">{run.status.toUpperCase()}</span>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '4px 0' }}>
              "{run.query}"
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
              marginTop: '8px',
              fontFamily: 'var(--font-mono)'
            }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>DURATION</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{run.durationSec}s</div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>MODELS</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{run.modelsCount}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>VERIFICATION</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{run.verificationPasses} PASSES</div>
              </div>

              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOKENS</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{run.tokens.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
