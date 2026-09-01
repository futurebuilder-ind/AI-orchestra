import React, { useEffect, useRef } from 'react';
import { Sparkles, Cpu, Layers, Zap } from 'lucide-react';

interface FuturisticHeroProps {
  isTyping?: boolean;
  onQuickQuery?: (queryText: string) => void;
}

export const FuturisticHero: React.FC<FuturisticHeroProps> = ({ isTyping = false, onQuickQuery }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Lightweight ambient particle canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 340);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle array
    const particles = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.2
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const accentRgb = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '0, 240, 255';

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentRgb}, ${p.alpha * 0.45})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const suggestions = [
    { title: 'Multi-Agent Code Review', query: 'Analyze a Python function for edge-case security vulnerabilities and memory leaks.', icon: Cpu },
    { title: 'Algorithmic Problem Solving', query: 'Solve for the definite integral of x^3 * e^(-x) from 0 to infinity step-by-step.', icon: Zap },
    { title: 'System Architecture Design', query: 'Design a resilient distributed microservices state machine with high throughput.', icon: Layers },
  ];

  return (
    <div className={`futuristic-hero-container ${isTyping ? 'hero-compact' : ''}`}>
      {/* Background ambient particle canvas */}
      <canvas ref={canvasRef} className="hero-particle-canvas" />

      {/* Holographic Orb Visual */}
      <div className="hero-orb-wrapper">
        <div className="hero-liquid-glow-ring ring-1" />
        <div className="hero-liquid-glow-ring ring-2" />
        <div className="hero-liquid-glow-ring ring-3" />

        <div className="hero-core-orb">
          <div className="hero-core-inner">
            <Sparkles className="hero-core-sparkle" size={28} />
          </div>
        </div>
      </div>

      {/* Hero Header Text */}
      <div className="hero-header-text">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          <span>MULTI-AGENT AI SYNTHESIS ENGINE</span>
        </div>
        <h1 className="hero-title">
          Orchestrate <span className="hero-title-gradient">Collective Intelligence</span>
        </h1>
        <p className="hero-subtitle">
          Dispatch parallel AI agent networks to solve complex problems, critique edge cases, and synthesize unified consensus.
        </p>
      </div>

      {/* Suggestion Chips */}
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
