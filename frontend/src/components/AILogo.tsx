import React from 'react';

interface AILogoProps {
  size?: number;
  showText?: boolean;
}

export const AILogo: React.FC<AILogoProps> = ({ size = 28, showText = true }) => {
  return (
    <div className="ai-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
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
        {/* Ambient Outer Halo */}
        <div 
          style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(6, 182, 212, 0.2) 50%, transparent 75%)',
            filter: 'blur(6px)',
            pointerEvents: 'none'
          }} 
        />
        
        {/* Ultra-Sharp Starburst Emblem */}
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'relative', zIndex: 2 }}
        >
          <defs>
            <radialGradient id="starCoreGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#fbbf24" />
              <stop offset="70%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </radialGradient>
            <linearGradient id="starRayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Micro Orbit Ring */}
          <circle cx="24" cy="24" r="21" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="2 3" />
          
          {/* Primary 4-Point Star Rays */}
          <path d="M24 2 L27.5 19.5 L45 24 L27.5 28.5 L24 46 L20.5 28.5 L3 24 L20.5 19.5 Z" fill="url(#starRayGradient)" />
          
          {/* Diagonal Secondary Star Rays */}
          <path d="M24 24 L35.5 12.5 L24 24 L35.5 35.5 L24 24 L12.5 35.5 L24 24 L12.5 12.5 Z" stroke="url(#starRayGradient)" strokeWidth="1.5" opacity="0.7" />

          {/* Glowing Center Core Orb */}
          <circle cx="24" cy="24" r="5" fill="url(#starCoreGradient)" />
          <circle cx="24" cy="24" r="2.5" fill="#ffffff" />
        </svg>
      </div>

      {showText && (
        <div className="ai-logo-text-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span 
            className="ai-logo-title" 
            style={{ 
              fontFamily: 'var(--font-display, "Syne", "Outfit", sans-serif)', 
              fontWeight: 700, 
              fontSize: '0.95rem', 
              letterSpacing: '0.22em', 
              color: '#ffffff',
              textTransform: 'uppercase',
              textShadow: '0 0 12px rgba(255, 255, 255, 0.2)'
            }}
          >
            AI ORCHESTRA
          </span>
        </div>
      )}
    </div>
  );
};

