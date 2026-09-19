import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Layers, Zap, FileText, ArrowRight } from 'lucide-react';
import { SectionParticleField } from './SectionParticleField';

const capabilities = [
  {
    stepNumber: '01',
    badge: '01 // COUNCIL',
    label: 'PROMPT',
    title: 'Multi-Agent Reasoning',
    description: 'Deploy a parallel council of specialized AI solvers and adversarial critics. Each agent contributes independent analysis, catching blindspots others miss.',
    icon: Layers,
    actionText: 'Explore Council',
    telemetry: ['IDEAS', 'QUERIES', 'OBJECTIVES', 'POSSIBILITIES']
  },
  {
    stepNumber: '02',
    badge: '02 // SYNTHESIS',
    label: 'COUNCIL',
    title: 'Model Comparison & Consensus',
    description: 'Run the same prompt across GPT, Gemini, Claude, and local Ollama models simultaneously. Compare reasoning approaches and synthesize the strongest answer.',
    icon: Cpu,
    actionText: 'Compare Models',
    telemetry: ['DIVERSE MINDS', 'DEEPER INSIGHTS', 'STRONGER ANSWERS']
  },
  {
    stepNumber: '03',
    badge: '03 // CONTEXT',
    label: 'ADVERSARIAL',
    title: 'File & Context Intelligence',
    description: 'Ingest PDF, DOCX, and text documents into multi-agent workflows. Every agent receives full context for document-aware reasoning and analysis.',
    icon: FileText,
    actionText: 'Inspect Context',
    telemetry: ['EVALUATE', 'DEBATE', 'SYNTHESIZE', 'CONVERGE']
  },
  {
    stepNumber: '04',
    badge: '04 // HYBRID',
    label: 'CONSENSUS',
    title: 'Hybrid Cloud & Local Engine',
    description: 'Seamlessly combine local Ollama inference with cloud frontier models. Keep sensitive data local while leveraging cloud capabilities when needed.',
    icon: Zap,
    actionText: 'View Hybrid Specs',
    telemetry: ['KNOWLEDGE', 'CONTEXT', 'ACCURACY', 'REAL IMPACT']
  }
];

export const FeaturesSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const STEP_DURATION_MS = 3800; // 3.8s per capability cycle
  const currentStepRef = useRef(0);
  const elapsedTimeRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  // Manual jump to a specific step
  const handleJumpToStep = (idx: number) => {
    currentStepRef.current = idx;
    elapsedTimeRef.current = idx * STEP_DURATION_MS;
    setActiveStep(idx);
    setStepProgress(0);
    setTotalProgress(idx);
  };

  // Continuous automatic cycle animation
  useEffect(() => {
    let animId: number;

    const animate = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (!isPaused) {
        elapsedTimeRef.current += delta;
        const totalDuration = STEP_DURATION_MS * 4;
        const loopTime = elapsedTimeRef.current % totalDuration;
        const currentStep = Math.floor(loopTime / STEP_DURATION_MS);
        const progressInStep = (loopTime % STEP_DURATION_MS) / STEP_DURATION_MS;
        const totalProg = (loopTime / totalDuration) * 4;

        if (currentStep !== currentStepRef.current) {
          currentStepRef.current = currentStep;
          setActiveStep(currentStep);
        }
        setStepProgress(progressInStep);
        setTotalProgress(totalProg);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPaused]);

  return (
    <section className="features-section gravitational-experience" id="features" ref={sectionRef}>
      {/* Mouse-reactive ambient particle field */}
      <SectionParticleField particleCount={140} colorPalette="mixed" />
      
      <div className="gravitational-inner">
        {/* Section Header */}
        <div className="features-header">
          <span className="features-eyebrow">CAPABILITIES</span>
          <h2 className="features-title">
            Built for <span className="features-title-accent">collective AI intelligence</span>
          </h2>
          <p className="features-subtitle">
            A unified orchestration layer designed to reason, critique, and synthesize across frontier models.
          </p>
        </div>

        {/* Mockup Composition: Left Timeline Track + Center Black Hole Canvas + Right Capability Stack + Far Right Telemetry */}
        <div className="gravitational-workspace-grid">
          {/* 1. Left Vertical Orbital Timeline Track */}
          <div className="orbital-timeline-track">
            {capabilities.map((cap, idx) => {
              const isActive = activeStep === idx;
              return (
                <div 
                  key={cap.stepNumber} 
                  className={`timeline-track-node ${isActive ? 'active' : ''}`}
                  onClick={() => handleJumpToStep(idx)}
                  title={`Select ${cap.title}`}
                >
                  <div className="track-marker-outer">
                    {isActive && <div className="track-active-badge">ACTIVE</div>}
                    <div className={`track-marker-orb ${isActive ? 'orb-active' : ''}`} />
                  </div>
                  {idx < capabilities.length - 1 && <div className="track-connector-line" />}
                </div>
              );
            })}
          </div>

          {/* 2. Center-Left Unified Gravitational Black Hole Docking Stage */}
          <div className="gravitational-canvas-stage" data-active-step={activeStep} aria-hidden="true">
            {/* The unified background particle black hole docks directly into this stage */}
            <div className="gravitational-dock-indicator" />
          </div>

          {/* 3. Center-Right Editorial Capability Stack */}
          <div 
            className="gravitational-editorial-stack"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              const isActive = activeStep === idx;

              return (
                <div 
                  key={cap.stepNumber} 
                  className={`gravitational-capability-row ${isActive ? 'active' : 'dormant'}`}
                  onClick={() => handleJumpToStep(idx)}
                >
                  <div className="cap-header-row">
                    <span className="cap-badge">{cap.badge}</span>
                    <Icon size={16} className="cap-icon" />
                  </div>

                  <h3 className="cap-title">
                    {cap.title}
                  </h3>

                  <p className="cap-description">
                    {cap.description}
                  </p>

                  {isActive && (
                    <div className="cap-action-link">
                      <span>{cap.actionText}</span>
                      <ArrowRight size={13} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 4. Far Right Technical Telemetry Block */}
          <div className="gravitational-telemetry-column">
            {capabilities[activeStep]?.telemetry.map((item, tIdx) => (
              <span key={tIdx} className="telemetry-word">{item}</span>
            ))}
            <div className="telemetry-bar-accent" />
          </div>
        </div>

        {/* Bottom Horizontal Sequence Timeline Bar */}
        <div className="gravitational-bottom-bar">
          <div className="bottom-bar-steps">
            {capabilities.map((cap, idx) => {
              const isActive = activeStep === idx;
              return (
                <div 
                  key={cap.stepNumber}
                  className={`bottom-step-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleJumpToStep(idx)}
                >
                  <span className="step-num-code">{cap.stepNumber}</span>
                  <span className="step-label-code">{cap.label}</span>
                </div>
              );
            })}
          </div>
          
          <div className="bottom-progress-track">
            <div 
              className="bottom-progress-indicator" 
              style={{ width: `${Math.min(100, Math.max(8, ((activeStep + stepProgress) / 4) * 100))}%` }} 
            />
          </div>
        </div>
      </div>
    </section>
  );
};
