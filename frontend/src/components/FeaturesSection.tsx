import React from 'react';
import { Cpu, Layers, Zap, FileText } from 'lucide-react';

const features = [
  {
    icon: Layers,
    title: 'Multi-Agent Reasoning',
    description: 'Deploy a parallel council of specialized AI solvers and adversarial critics. Each agent contributes independent analysis, catching blindspots others miss.',
    badge: '01 // COUNCIL'
  },
  {
    icon: Cpu,
    title: 'Model Comparison & Consensus',
    description: 'Run the same prompt across GPT, Gemini, Claude, and local Ollama models simultaneously. Compare reasoning approaches and synthesize the strongest answer.',
    badge: '02 // SYNTHESIS'
  },
  {
    icon: FileText,
    title: 'File & Context Intelligence',
    description: 'Ingest PDF, DOCX, and text documents into multi-agent workflows. Every agent receives full context for document-aware reasoning and analysis.',
    badge: '03 // CONTEXT'
  },
  {
    icon: Zap,
    title: 'Hybrid Cloud & Local Engine',
    description: 'Seamlessly combine local Ollama inference with cloud frontier models. Keep sensitive data local while leveraging cloud capabilities when needed.',
    badge: '04 // HYBRID'
  }
];

export const FeaturesSection: React.FC = () => {
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="features-section" id="features">
      <div className="features-inner">
        <div className="features-header">
          <span className="features-eyebrow">CAPABILITIES</span>
          <h2 className="features-title">
            Built for <span className="features-title-accent">collective AI intelligence</span>
          </h2>
          <p className="features-subtitle">
            A unified orchestration layer designed to reason, critique, and synthesize across frontier models.
          </p>
        </div>

        {/* Hairline Divider Editorial List */}
        <div className="features-editorial-list">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="feature-editorial-item">
                <span className="feature-item-badge">{feature.badge}</span>
                <h3 className="feature-item-title">
                  <Icon size={17} className="feature-item-icon" />
                  <span>{feature.title}</span>
                </h3>
                <p className="feature-item-desc">{feature.description}</p>
                <div className="feature-minimal-indicators">
                  <span className="indicator-status-dot" />
                  <span className="indicator-label">SYNCHRONIZED ACTIVE STATE</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Minimal Pipeline Sequence */}
        <div className="pipeline-demo-minimal">
          <div className={`pipeline-step-min ${activeStep === 0 ? 'active' : ''}`}>
            <span className="step-num-min">01</span>
            <span className="step-name-min">PROMPT</span>
          </div>
          <div className="pipeline-dash">—</div>
          <div className={`pipeline-step-min ${activeStep === 1 ? 'active' : ''}`}>
            <span className="step-num-min">02</span>
            <span className="step-name-min">COUNCIL</span>
          </div>
          <div className="pipeline-dash">—</div>
          <div className={`pipeline-step-min ${activeStep === 2 ? 'active' : ''}`}>
            <span className="step-num-min">03</span>
            <span className="step-name-min">ADVERSARIAL</span>
          </div>
          <div className="pipeline-dash">—</div>
          <div className={`pipeline-step-min ${activeStep === 3 ? 'active' : ''}`}>
            <span className="step-num-min">04</span>
            <span className="step-name-min">CONSENSUS</span>
          </div>
        </div>
      </div>
    </section>
  );
};

