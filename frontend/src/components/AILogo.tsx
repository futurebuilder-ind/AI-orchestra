import React from 'react';

interface AILogoProps {
  size?: number;
  showText?: boolean;
}

export const AILogo: React.FC<AILogoProps> = ({ size = 28, showText = true }) => {
  return (
    <div className="ai-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div 
        className="ai-logo-hologram" 
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {/* Outer glowing pulsing ring */}
        <div className="ai-logo-ring outer-ring" />
        
        {/* Middle rotating energy ring */}
        <div className="ai-logo-ring middle-ring" />
        
        {/* Inner orb core */}
        <div className="ai-logo-core" />
        
        {/* Center SVG Spark / Atom */}
        <svg 
          width={size * 0.55} 
          height={size * 0.55} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ position: 'relative', zIndex: 2, color: 'var(--accent-color, #00f0ff)' }}
        >
          <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" opacity="0.85" />
          <circle cx="12" cy="12" r="3" fill="var(--accent-color, #00f0ff)" />
        </svg>
      </div>

      {showText && (
        <div className="ai-logo-text-group" style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="ai-logo-title" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.92rem', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
            AI ORCHESTRA
          </span>
          <span className="ai-logo-subtitle" style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            COMMAND CENTER
          </span>
        </div>
      )}
    </div>
  );
};
