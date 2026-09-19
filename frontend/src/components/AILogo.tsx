import React from 'react';

interface AILogoProps {
  size?: number;
  showText?: boolean;
  subtitle?: string;
}

export const AILogo: React.FC<AILogoProps> = ({ size = 24, showText = true, subtitle }) => {
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
        {/* Premium 8-Point Starburst Emblem with Orbital Ring & Luminous Point */}
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'relative', zIndex: 2 }}
        >
          <defs>
            <linearGradient id="starburstGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
            </linearGradient>
            <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Tiny Orbital Ring */}
          <ellipse cx="16" cy="16" rx="12" ry="4.5" stroke="url(#ringGrad)" strokeWidth="0.8" transform="rotate(-25 16 16)" strokeDasharray="3 2" opacity="0.85" />
          <ellipse cx="16" cy="16" rx="11" ry="11" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />

          {/* 8-Point Subtle Starburst */}
          {/* 4 Cardinal Rays */}
          <path d="M16 2.5L17.5 13.5L16 16L14.5 13.5Z" fill="url(#starburstGrad)" />
          <path d="M16 29.5L17.5 18.5L16 16L14.5 18.5Z" fill="url(#starburstGrad)" />
          <path d="M2.5 16L13.5 14.5L16 16L13.5 17.5Z" fill="url(#starburstGrad)" />
          <path d="M29.5 16L18.5 14.5L16 16L18.5 17.5Z" fill="url(#starburstGrad)" />
          {/* 4 Diagonal Rays */}
          <path d="M6.5 6.5L14.2 13.2L16 16L13.2 14.2Z" fill="url(#starburstGrad)" opacity="0.85" />
          <path d="M25.5 25.5L17.8 18.8L16 16L18.8 17.8Z" fill="url(#starburstGrad)" opacity="0.85" />
          <path d="M25.5 6.5L18.8 14.2L16 16L17.8 13.2Z" fill="url(#starburstGrad)" opacity="0.85" />
          <path d="M6.5 25.5L13.2 17.8L16 16L14.2 18.8Z" fill="url(#starburstGrad)" opacity="0.85" />

          {/* Tiny Orbital micro-dots */}
          <circle cx="23" cy="11" r="1" fill="#38bdf8" />
          <circle cx="9" cy="21" r="0.8" fill="#fbbf24" opacity="0.9" />

          {/* Central Luminous Point with bloom */}
          <circle cx="16" cy="16" r="2.2" fill="#ffffff" filter="url(#coreGlow)" />
        </svg>
      </div>

      {showText && (
        <div className="ai-logo-text-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span 
            className="ai-logo-title" 
            style={{ 
              fontFamily: 'var(--font-sans, "Inter", sans-serif)', 
              fontWeight: 600, 
              fontSize: '0.84rem', 
              letterSpacing: '0.06em', 
              color: '#ffffff',
              lineHeight: 1.15
            }}
          >
            AI ORCHESTRA
          </span>
          {subtitle && (
            <span 
              className="ai-logo-subtitle"
              style={{
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                fontWeight: 500,
                fontSize: '0.56rem',
                letterSpacing: '0.12em',
                color: '#94a3b8',
                marginTop: '2px',
                textTransform: 'uppercase'
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
