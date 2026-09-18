import React from 'react';
import { Cpu, Layers, Zap, FileText } from 'lucide-react';

const features = [
  {
    icon: Layers,
    title: 'Multi-Agent Reasoning',
    description: 'Deploy a parallel council of specialized AI solvers and adversarial critics. Each agent contributes independent analysis, catching blindspots others miss.',
    badge: 'COUNCIL'
  },
  {
    icon: Cpu,
    title: 'Model Comparison & Consensus',
    description: 'Run the same prompt across GPT, Gemini, Claude, and local Ollama models simultaneously. Compare reasoning approaches and synthesize the strongest answer.',
    badge: 'SYNTHESIS'
  },
  {
    icon: FileText,
    title: 'File & Context Intelligence',
    description: 'Ingest PDF, DOCX, and text documents into multi-agent workflows. Every agent receives full context for document-aware reasoning and analysis.',
    badge: 'CONTEXT'
  },
  {
    icon: Zap,
    title: 'Hybrid Cloud & Local Engine',
    description: 'Seamlessly combine local Ollama inference with cloud frontier models. Keep sensitive data local while leveraging cloud capabilities when needed.',
    badge: 'HYBRID'
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
            Everything you need for{' '}
            <span className="features-title-accent">collective AI intelligence</span>
          </h2>
          <p className="features-subtitle">
            A unified orchestration layer that transforms how you interact with AI models.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="feature-card">
                <div className="feature-card-icon">
                  <Icon size={20} />
                </div>
                <div className="feature-card-badge">{feature.badge}</div>
                <h3 className="feature-card-title">{feature.title}</h3>
                <p className="feature-card-desc">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Visual Pipeline Demo */}
        <div className="pipeline-demo">
          <div className={`pipeline-step ${activeStep === 0 ? 'active' : ''}`}>
            <div className="pipeline-step-num">1</div>
            <div className="pipeline-step-label">Prompt</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className={`pipeline-step ${activeStep === 1 ? 'active' : ''}`}>
            <div className="pipeline-step-num">N</div>
            <div className="pipeline-step-label">Models</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className={`pipeline-step ${activeStep === 2 ? 'active' : ''}`}>
            <div className="pipeline-step-num">✓</div>
            <div className="pipeline-step-label">Adversarial</div>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className={`pipeline-step ${activeStep === 3 ? 'active' : ''}`}>
            <div className="pipeline-step-num">★</div>
            <div className="pipeline-step-label">Consensus</div>
          </div>
        </div>
      </div>
    </section>
  );
};
