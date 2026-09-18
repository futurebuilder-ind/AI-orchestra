import React, { useEffect, useRef } from 'react';
import { EffectsConfig } from '../types';

interface CosmicBackgroundProps {
  effects?: EffectsConfig;
}

interface Particle {
  t: number;           // Parametric position along infinity lemniscate curve (0 to 2*PI)
  speed: number;       // Flow speed along curve
  offsetX: number;     // Random scatter offset perp X
  offsetY: number;     // Random scatter offset perp Y
  z: number;           // Z depth offset
  size: number;
  baseAlpha: number;
  color: [number, number, number];
  isCyanLoop: boolean; // Left cyan vs right amber stream
  layer: 'bg' | 'mid' | 'fg';
}

interface Point2D {
  x: number;
  y: number;
}

// Sample point-field target coordinates from rendered canvas text
const sampleTextTargets = (text: string, count: number, canvasWidth: number, canvasHeight: number): Point2D[] => {
  const offscreen = document.createElement('canvas');
  const w = (offscreen.width = 600);
  const h = (offscreen.height = 160);
  const ctx = offscreen.getContext('2d');
  if (!ctx) return Array.from({ length: count }, () => ({ x: 0, y: 0 }));

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 54px "Geist", "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);

  const imgData = ctx.getImageData(0, 0, w, h);
  const points: Point2D[] = [];
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / (count * 12))));

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4;
      if (imgData.data[idx + 3] > 128) {
        const screenX = (x - w / 2) * (Math.min(canvasWidth, 1400) / 720);
        const screenY = (y - h / 2) * (Math.min(canvasWidth, 1400) / 720);
        points.push({ x: screenX, y: screenY });
      }
    }
  }

  if (points.length === 0) return Array.from({ length: count }, () => ({ x: 0, y: 0 }));

  const targets: Point2D[] = [];
  for (let i = 0; i < count; i++) {
    const pt = points[i % points.length];
    const jitterX = (Math.random() - 0.5) * 4;
    const jitterY = (Math.random() - 0.5) * 4;
    targets.push({ x: pt.x + jitterX, y: pt.y + jitterY });
  }

  return targets;
};

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

    // Mouse tracking with linear interpolation (lerp)
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;
    let mouseX = width / 2;
    let mouseY = height / 2;

    // Scroll progress scrubbing state
    let targetScrollRatio = 0;
    let currentScrollRatio = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      updateTextTargets();
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    const handleScroll = () => {
      const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const winHeight = window.innerHeight;
      const maxScroll = Math.max(1, docHeight - winHeight);
      targetScrollRatio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // High-density particle counts
    const totalCount = isMobile ? 220 : 550;
    const focalLength = 650;

    // Cyan Stream Color Palette (Left Loop)
    const cyanPalette: [number, number, number][] = [
      [255, 255, 255], // pure white spark
      [207, 250, 254], // soft cyan
      [6, 182, 212],   // vibrant cyan
      [59, 130, 246],  // azure blue
      [99, 102, 241],  // deep indigo
      [147, 197, 253]  // icy sky blue
    ];

    // Amber Stream Color Palette (Right Loop)
    const amberPalette: [number, number, number][] = [
      [255, 255, 255], // pure white spark
      [254, 243, 199], // soft gold
      [245, 158, 11],  // warm amber
      [251, 191, 36],  // bright gold
      [217, 119, 6],   // deep bronze
      [249, 115, 22]   // warm orange
    ];

    // Word target mappings for scroll morphing
    let targetWords: Record<string, Point2D[]> = {};

    const updateTextTargets = () => {
      targetWords = {
        OPENING: sampleTextTargets('AI ORCHESTRA', totalCount, width, height),
        ORCHESTRATE: sampleTextTargets('ORCHESTRATE', totalCount, width, height),
        REASON: sampleTextTargets('REASON', totalCount, width, height),
        SYNTHESIZE: sampleTextTargets('SYNTHESIZE', totalCount, width, height),
        CONSENSUS: sampleTextTargets('CONSENSUS', totalCount, width, height),
      };
    };
    updateTextTargets();

    // Generate Infinity Ribbon Particle System along Lemniscate equation
    const particles: Particle[] = Array.from({ length: totalCount }, (_, i) => {
      const t = (i / totalCount) * Math.PI * 2;
      const speed = 0.0004 + Math.random() * 0.0012;
      
      // Determine if particle belongs primarily to left cyan loop (cos(t) < 0) or right amber loop (cos(t) > 0)
      const isCyanLoop = Math.cos(t) < 0 || Math.random() < 0.15;
      const palette = isCyanLoop ? cyanPalette : amberPalette;
      const color = palette[Math.floor(Math.random() * palette.length)];

      const layerRand = Math.random();
      const layer: 'bg' | 'mid' | 'fg' = layerRand < 0.25 ? 'bg' : layerRand < 0.75 ? 'mid' : 'fg';

      return {
        t,
        speed,
        offsetX: (Math.random() - 0.5) * (layer === 'fg' ? 45 : 30),
        offsetY: (Math.random() - 0.5) * (layer === 'fg' ? 45 : 30),
        z: (Math.random() - 0.5) * 260,
        size: layer === 'fg' ? Math.random() * 2.8 + 1.2 : layer === 'mid' ? Math.random() * 1.5 + 0.6 : Math.random() * 0.8 + 0.3,
        baseAlpha: layer === 'fg' ? Math.random() * 0.4 + 0.55 : layer === 'mid' ? Math.random() * 0.35 + 0.25 : Math.random() * 0.25 + 0.08,
        color,
        isCyanLoop,
        layer
      };
    });

    let time = 0;
    const startTime = performance.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;
      const elapsedSeconds = (performance.now() - startTime) / 1000;

      // Lerped mouse tracking
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      // Lerped scroll ratio scrubbing (bidirectional)
      currentScrollRatio += (targetScrollRatio - currentScrollRatio) * 0.08;

      // Initial page-load formation calculation (0s to 5s)
      let initialFormationWeight = 0;
      if (!reduceMotion && elapsedSeconds > 0.4 && elapsedSeconds < 4.5) {
        if (elapsedSeconds < 1.6) {
          initialFormationWeight = (elapsedSeconds - 0.4) / 1.2;
        } else if (elapsedSeconds < 3.0) {
          initialFormationWeight = 1.0;
        } else {
          initialFormationWeight = 1.0 - (elapsedSeconds - 3.0) / 1.5;
        }
      }
      initialFormationWeight = Math.max(0, Math.min(1, initialFormationWeight));

      // Scroll-driven word formation calculation
      let scrollActiveWord = '';
      let scrollFormationWeight = 0;

      if (!reduceMotion && initialFormationWeight < 0.01 && currentScrollRatio > 0.15) {
        const stages = [
          { min: 0.20, max: 0.38, word: 'ORCHESTRATE' },
          { min: 0.42, max: 0.60, word: 'REASON' },
          { min: 0.65, max: 0.82, word: 'SYNTHESIZE' },
          { min: 0.85, max: 1.00, word: 'CONSENSUS' }
        ];

        for (const stage of stages) {
          if (currentScrollRatio >= stage.min && currentScrollRatio <= stage.max) {
            const range = stage.max - stage.min;
            const progress = (currentScrollRatio - stage.min) / range;
            scrollActiveWord = stage.word;
            scrollFormationWeight = Math.sin(progress * Math.PI);
            break;
          }
        }
      }

      // Infinity Ribbon Center Center Origin
      const centerX = width / 2;
      const centerY = height * (isMobile ? 0.32 : 0.36);

      // Curve Scale Radius
      const lemniscateScale = Math.min(width * 0.42, 640);

      // --- RENDER CENTRAL STARBURST FLARE & AMBIENT GLOW ---
      const starGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.55);
      starGlow.addColorStop(0, 'rgba(255, 245, 230, 0.12)');
      starGlow.addColorStop(0.2, 'rgba(245, 158, 11, 0.04)');
      starGlow.addColorStop(0.45, 'rgba(6, 182, 212, 0.025)');
      starGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = starGlow;
      ctx.fillRect(0, 0, width, height);

      // Central Starburst Flare Crosshair (Center Intersection)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(time * 0.05);

      // Horizontal / Vertical Flare Rays
      const flareGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 90);
      flareGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      flareGrad.addColorStop(0.2, 'rgba(251, 191, 36, 0.4)');
      flareGrad.addColorStop(0.6, 'rgba(6, 182, 212, 0.15)');
      flareGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 110, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(0, 0, 2.5, 110, 0, 0, Math.PI * 2);
      ctx.fill();

      // Core Diamond Flare
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.restore();

      // Mouse Parallax Offset Calculation
      const parallaxX = isMobile ? 0 : (mouseX - width / 2) * 0.012;
      const parallaxY = isMobile ? 0 : (mouseY - height / 2) * 0.012;

      // Sort Particles by Z-depth (Back-to-Front Rendering)
      const sortedParticles = [...particles].sort((a, b) => a.z - b.z);

      sortedParticles.forEach((p, idx) => {
        if (!reduceMotion) {
          // Flow along Bernoulli Lemniscate parametric curve
          p.t += p.speed;
          if (p.t > Math.PI * 2) p.t -= Math.PI * 2;
        }

        // Bernoulli Lemniscate formula: x = a*cos(t)/(1+sin^2(t)), y = a*sin(t)*cos(t)/(1+sin^2(t))
        const sinT = Math.sin(p.t);
        const cosT = Math.cos(p.t);
        const denom = 1 + sinT * sinT;
        const curveX = (lemniscateScale * cosT) / denom;
        const curveY = (lemniscateScale * sinT * cosT * 0.75) / denom;

        const posX = curveX + p.offsetX;
        const posY = curveY + p.offsetY;

        // 3D Perspective Projection
        const scale = focalLength / (focalLength + p.z);
        let screenX = centerX + (posX + parallaxX) * scale;
        let screenY = centerY + (posY + parallaxY) * scale;

        // Apply Initial Page-Load Text Formation Target Morphing
        if (initialFormationWeight > 0.01 && targetWords.OPENING) {
          const target = targetWords.OPENING[idx % targetWords.OPENING.length];
          const tx = centerX + target.x;
          const ty = centerY + target.y;
          const easeW = Math.pow(initialFormationWeight, 1.8);
          screenX = screenX * (1 - easeW) + tx * easeW;
          screenY = screenY * (1 - easeW) + ty * easeW;
        }
        // Apply Scroll-Driven Word Formation Target Morphing
        else if (scrollFormationWeight > 0.01 && scrollActiveWord && targetWords[scrollActiveWord]) {
          const target = targetWords[scrollActiveWord][idx % targetWords[scrollActiveWord].length];
          const tx = centerX + target.x;
          const ty = centerY + target.y;
          const easeW = Math.pow(scrollFormationWeight, 1.8);
          screenX = screenX * (1 - easeW) + tx * easeW;
          screenY = screenY * (1 - easeW) + ty * easeW;
        }

        const projectedSize = p.size * scale;
        const depthFactor = Math.max(0.15, Math.min(1, scale));
        const twinkle = reduceMotion ? 1 : 0.75 + 0.25 * Math.sin(time * 2.5 + idx);
        const alpha = p.baseAlpha * depthFactor * twinkle;

        if (alpha < 0.015) return;
        if (screenX < -30 || screenX > width + 30 || screenY < -30 || screenY > height + 30) return;

        const [r, g, b] = p.color;

        // Foreground Soft Bloom Aura
        if (p.layer === 'fg' && projectedSize > 1.3) {
          ctx.beginPath();
          ctx.arc(screenX, screenY, projectedSize * 3.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.12})`;
          ctx.fill();
        }

        // Core Particle Point
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(0.4, projectedSize), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [effects]);

  return (
    <div className="cosmic-background-wrapper" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};

