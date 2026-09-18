import React from 'react';

interface AILogoProps {
  size?: number;
  showText?: boolean;
}

export const AILogo: React.FC<AILogoProps> = ({ size = 20, showText = true }) => {
  return (
    <div className="ai-logo-container" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
      <div 
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
        {/* Subtle Ambient Core Illumination */}
        <div 
          style={{
            position: 'absolute',
            inset: '-1px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} 
        />
        
        {/* Minimal Precision Emblem: Precision Star + Orbital Ring */}
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'relative', zIndex: 2 }}
        >
          {/* Delicate Outer Orbital Ring */}
          <circle 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth="0.8" 
          />
          
          {/* Orbital Satellite Node */}
          <circle cx="19.5" cy="8" r="1.5" fill="#38bdf8" />

          {/* 4-Ray Precision Signal Star */}
          <path 
            d="M12 3.5 C12 8 12.5 11.5 17 12 C12.5 12.5 12 16 12 20.5 C12 16 11.5 12.5 7 12 C11.5 11.5 12 8 12 3.5 Z" 
            fill="url(#aiEmblemGrad)" 
          />

          {/* Center Photon Core */}
          <circle cx="12" cy="12" r="1.2" fill="#ffffff" />

          <defs>
            <linearGradient id="aiEmblemGrad" x1="7" y1="3.5" x2="17" y2="20.5">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="ai-logo-text-group" style={{ display: 'flex', alignItems: 'center' }}>
          <span 
            className="ai-logo-title" 
            style={{ 
              fontFamily: 'var(--font-sans, "Geist", "Inter", sans-serif)', 
              fontWeight: 600, 
              fontSize: '0.85rem', 
              letterSpacing: '0.12em', 
              color: '#ffffff',
              textTransform: 'uppercase'
            }}
          >
            AI ORCHESTRA
          </span>
        </div>
      )}
    </div>
  );
};



