import React from 'react';
import { Cpu, Layers, Zap, ArrowUpRight, Compass } from 'lucide-react';
import { CinematicOrchestraNetwork } from './CinematicOrchestraNetwork';

interface FuturisticHeroProps {
  isTyping?: boolean;
  onQuickQuery?: (queryText: string) => void;
  availableModels?: string[];
  onLaunchConsole?: () => void;
}

export const FuturisticHero: React.FC<FuturisticHeroProps> = ({ 
  isTyping = false, 
  onQuickQuery, 
  availableModels,
  onLaunchConsole
}) => {
  const suggestions = [
    { title: 'Multi-Agent Code Review', query: 'Analyze a Python function for edge-case security vulnerabilities and memory leaks.', icon: Cpu },
    { title: 'Algorithmic Problem Solving', query: 'Solve for the definite integral of x^3 * e^(-x) from 0 to infinity step-by-step.', icon: Zap },
    { title: 'System Architecture Design', query: 'Design a resilient distributed microservices state machine with high throughput.', icon: Layers },
  ];

  return (
    <div className={`futuristic-hero-container ${isTyping ? 'hero-compact' : ''}`}>
      {/* --- FLOATING CORNER TELEMETRY METRICS --- */}
      <div className="hero-telemetry-corner telemetry-top-left">
        <span className="telemetry-label">FROM</span>
        <span className="telemetry-label">PROMPTS</span>
        <span className="telemetry-label">TO</span>
        <span className="telemetry-label">POSSIBILITIES</span>
        <div className="telemetry-line" />
      </div>

      <div className="hero-telemetry-corner telemetry-top-right">
        <span className="telemetry-label">MULTI-MODEL</span>
        <span className="telemetry-label">INTELLIGENCE</span>
        <span className="telemetry-label">FOR A BRIGHTER TOMORROW</span>
      </div>

      <div className="hero-telemetry-corner telemetry-bottom-left">
        <span className="telemetry-label">— INTELLIGENCE</span>
        <span className="telemetry-label">  IN HARMONY</span>
      </div>

      <div className="hero-telemetry-corner telemetry-bottom-right">
        <span className="telemetry-label">— BUILT</span>
        <span className="telemetry-label">  FOR HUMAN</span>
        <span className="telemetry-label">  POTENTIAL</span>
      </div>

      {/* --- CENTRAL HERO CONTENT BLOCK --- */}
      <div className="hero-center-content">
        {/* Clean, Elegant Research Headline — Geist/Inter, Uncropped */}
        <h1 className="hero-headline-research">
          AI ORCHESTRA
        </h1>

        {/* Wide Letter-Spaced Sub-Heading */}
        <div className="hero-subheadline-research">
          ORCHESTRATE &nbsp; INTELLIGENCE &nbsp; BEYOND &nbsp; LIMITS
        </div>

        {/* Subtitle Paragraph */}
        <p className="hero-description-research">
          A unified intelligence layer to reason, compare, and create with the world's most advanced AI models.
        </p>

        {/* Action CTAs Row */}
        <div className="hero-cta-research-row">
          <button
            className="cta-btn-research-primary"
            onClick={() => onLaunchConsole ? onLaunchConsole() : null}
          >
            <span>Enter AI Orchestra</span>
            <ArrowUpRight size={15} />
          </button>
          <a href="#features" className="cta-btn-research-secondary">
            <span>Explore Architecture</span>
            <Compass size={14} style={{ marginLeft: '4px' }} />
          </a>
        </div>
      </div>

      {/* --- BOTTOM ANIMATED CAPSULE SCROLL INDICATOR --- */}
      <div className="hero-scroll-indicator">
        <div className="scroll-capsule">
          <div className="scroll-dot" />
        </div>
        <span className="scroll-text">SCROLL TO EXPLORE</span>
      </div>

      {/* --- PRESERVED CINEMATIC ORCHESTRA NETWORK (FLOATING) --- */}
      <div className="hero-network-floating-wrapper">
        <div className="network-header-badge">
          <span className="badge-dot" />
          <span>LIVE ARCHITECTURE ENGINE</span>
        </div>
        <CinematicOrchestraNetwork modelNames={availableModels} />
      </div>

      {/* --- MINIMAL EDITORIAL PROMPT SUGGESTIONS --- */}
      <div className="hero-suggestions-research-list">
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              className="hero-suggestion-research-item"
              onClick={() => onQuickQuery && onQuickQuery(item.query)}
            >
              <div className="suggestion-icon-dot">
                <Icon size={14} />
              </div>
              <div className="suggestion-text-block">
                <span className="suggestion-title-label">{item.title}</span>
                <span className="suggestion-query-snippet">"{item.query}"</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};


