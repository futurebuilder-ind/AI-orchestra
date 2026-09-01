import React, { useEffect, useRef } from 'react';
import { EffectsConfig } from '../types';

interface CosmicBackgroundProps {
  effects?: EffectsConfig;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ effects }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const isMobile = window.innerWidth <= 767;
    const reduceMotion = effects?.reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Star Field Generation
    const starCount = isMobile ? 40 : 110;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      layer: Math.random() < 0.3 ? 1 : Math.random() < 0.7 ? 2 : 3
    }));

    // Distant Planets
    const planetCount = isMobile ? 1 : 3;
    const planets = Array.from({ length: planetCount }, (_, idx) => ({
      x: (width * (idx + 1)) / (planetCount + 1) + (Math.random() * 80 - 40),
      y: Math.random() * (height * 0.4) + height * 0.1,
      radius: idx === 0 ? 14 : idx === 1 ? 8 : 22,
      color: idx === 0 ? 'rgba(0, 240, 255, 0.12)' : idx === 1 ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
      ring: idx === 2
    }));

    // Shooting Stars
    interface ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      alpha: number;
      angle: number;
      active: boolean;
    }

    let activeShootingStar: ShootingStar | null = null;
    let nextShootingStarTime = Date.now() + Math.random() * 6000 + 4000;

    const createShootingStar = () => {
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2; // ~45 deg
      activeShootingStar = {
        x: Math.random() * width * 0.7,
        y: Math.random() * height * 0.3,
        length: Math.random() * 80 + 50,
        speed: Math.random() * 10 + 12,
        alpha: 1.0,
        angle,
        active: true
      };
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Distant Planets
      planets.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        if (p.ring) {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.radius * 2.2, p.radius * 0.5, Math.PI / 6, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // 2. Star Field
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#00f0ff';
      const accentRgb = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '0, 240, 255';

      stars.forEach((s) => {
        if (!reduceMotion) {
          s.alpha += s.twinkleSpeed;
          if (s.alpha > 0.95 || s.alpha < 0.15) s.twinkleSpeed = -s.twinkleSpeed;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        if (s.layer === 1) {
          ctx.fillStyle = `rgba(${accentRgb}, ${s.alpha * 0.7})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha * 0.6})`;
        }
        ctx.fill();
      });

      // 3. Shooting Stars (subtle randomized timing)
      if (!reduceMotion && !isMobile) {
        if (!activeShootingStar && Date.now() > nextShootingStarTime) {
          createShootingStar();
          nextShootingStarTime = Date.now() + Math.random() * 8000 + 5000;
        }

        if (activeShootingStar && activeShootingStar.active) {
          const ss = activeShootingStar;
          const endX = ss.x + Math.cos(ss.angle) * ss.length;
          const endY = ss.y + Math.sin(ss.angle) * ss.length;

          const grad = ctx.createLinearGradient(ss.x, ss.y, endX, endY);
          grad.addColorStop(0, `rgba(${accentRgb}, ${ss.alpha})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.beginPath();
          ctx.moveTo(ss.x, ss.y);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.8;
          ctx.stroke();

          ss.x += Math.cos(ss.angle) * ss.speed;
          ss.y += Math.sin(ss.angle) * ss.speed;
          ss.alpha -= 0.02;

          if (ss.alpha <= 0 || ss.x > width || ss.y > height) {
            activeShootingStar = null;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [effects]);

  return (
    <div className="cosmic-background-wrapper" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};
