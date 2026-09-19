import React from 'react';
import { Cpu, Layers, Zap } from 'lucide-react';
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

      </div>

      {/* --- PRESERVED CINEMATIC ORCHESTRA NETWORK (FLOATING) --- */}
      <div className="hero-network-floating-wrapper">
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


