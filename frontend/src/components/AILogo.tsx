import React from 'react';

interface AILogoProps {
  size?: number;
  showText?: boolean;
}

export const AILogo: React.FC<AILogoProps> = ({ size = 20, showText = true }) => {
  return (
    <div className="ai-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
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
        {/* Subtle Ambient Core Glow */}
        <div 
          style={{
            position: 'absolute',
            inset: '-2px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} 
        />
        
        {/* Minimal Research Emblem (4-point signal star + orbital dot) */}
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'relative', zIndex: 2 }}
        >
          {/* Subtle Outer Ring */}
          <circle cx="12" cy="12" r="9.5" stroke="rgba(255, 255, 255, 0.18)" strokeWidth="1" />
          
          {/* Signal Starburst Core */}
          <path 
            d="M12 4.5 L13.2 10.8 L19.5 12 L13.2 13.2 L12 19.5 L10.8 13.2 L4.5 12 L10.8 10.8 Z" 
            fill="url(#emblemGrad)" 
          />

          <defs>
            <linearGradient id="emblemGrad" x1="4.5" y1="4.5" x2="19.5" y2="19.5">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Center Point */}
          <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
        </svg>
      </div>

      {showText && (
        <div className="ai-logo-text-group" style={{ display: 'flex', alignItems: 'center' }}>
          <span 
            className="ai-logo-title" 
            style={{ 
              fontFamily: 'var(--font-sans, "Geist", "Inter", sans-serif)', 
              fontWeight: 600, 
              fontSize: '0.88rem', 
              letterSpacing: '0.14em', 
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


