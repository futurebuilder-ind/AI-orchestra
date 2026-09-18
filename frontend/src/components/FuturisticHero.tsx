import React from 'react';
import { Cpu, Layers, Zap } from 'lucide-react';
import { CinematicOrchestraNetwork } from './CinematicOrchestraNetwork';

interface FuturisticHeroProps {
  isTyping?: boolean;
  onQuickQuery?: (queryText: string) => void;
  availableModels?: string[];
}

export const FuturisticHero: React.FC<FuturisticHeroProps> = ({ isTyping = false, onQuickQuery, availableModels }) => {
  const suggestions = [
    { title: 'Multi-Agent Code Review', query: 'Analyze a Python function for edge-case security vulnerabilities and memory leaks.', icon: Cpu },
    { title: 'Algorithmic Problem Solving', query: 'Solve for the definite integral of x^3 * e^(-x) from 0 to infinity step-by-step.', icon: Zap },
    { title: 'System Architecture Design', query: 'Design a resilient distributed microservices state machine with high throughput.', icon: Layers },
  ];

  return (
    <div className={`futuristic-hero-container ${isTyping ? 'hero-compact' : ''}`}>
      {/* Hero Header */}
      <div className="hero-header-text">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          <span>AI ORCHESTRATION PLATFORM</span>
        </div>

        <h1 className="hero-title">
          One Prompt.{' '}
          <span className="hero-title-gradient">Many AI Minds.</span>
        </h1>

        <p className="hero-subtitle">
          Dispatch tasks across specialized AI models simultaneously. Critique logic, eliminate blindspots, and synthesize unified consensus — all from a single prompt.
        </p>

        <div className="hero-cta-row">
          <button
            className="hero-cta-primary"
            onClick={() => {
              const inputEl = document.querySelector('.input-textarea') as HTMLTextAreaElement;
              if (inputEl) inputEl.focus();
            }}
          >
            Get Started Free
          </button>
          <a href="#features" className="hero-cta-secondary">
            Explore Architecture
          </a>
        </div>

        <p className="hero-micro-text">
          Supports Ollama, Gemini & OpenRouter · No API key required to test
        </p>
      </div>

      {/* Cinematic Orchestra Network */}
      <CinematicOrchestraNetwork modelNames={availableModels} />

      {/* Suggestion Cards */}
      <div className="hero-suggestions-grid">
        {suggestions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              className="hero-suggestion-card"
              onClick={() => onQuickQuery && onQuickQuery(item.query)}
            >
              <div className="suggestion-icon-wrapper">
                <Icon size={16} />
              </div>
              <div className="suggestion-content">
                <span className="suggestion-title">{item.title}</span>
                <span className="suggestion-query">"{item.query}"</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
