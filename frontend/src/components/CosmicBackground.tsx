import React, { useEffect, useRef } from 'react';
import { EffectsConfig } from '../types';

interface CosmicBackgroundProps {
  effects?: EffectsConfig;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  baseAlpha: number;
  color: [number, number, number];
  orbitAngle: number;
  orbitSpeed: number;
  orbitRadius: number;
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
  ctx.font = '600 58px "Geist", "Inter", sans-serif';
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
        // Map relative to screen center
        const screenX = (x - w / 2) * (Math.min(canvasWidth, 1400) / 750);
        const screenY = (y - h / 2) * (Math.min(canvasWidth, 1400) / 750);
        points.push({ x: screenX, y: screenY });
      }
    }
  }

  if (points.length === 0) return Array.from({ length: count }, () => ({ x: 0, y: 0 }));

  // Populate target array matching particle count
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
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const winHeight = window.innerHeight;
      const maxScroll = Math.max(1, docHeight - winHeight);
      targetScrollRatio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // High-end color palette: cyan, violet, indigo, warm white, amber
    const colorPalette: [number, number, number][] = [
      [255, 255, 255],    // pure white highlight
      [255, 248, 230],    // warm white
      [200, 220, 255],    // soft blue
      [139, 92, 246],     // vibrant violet
      [99, 102, 241],     // indigo
      [59, 130, 246],     // azure blue
      [6, 182, 212],      // computational cyan
      [245, 158, 11],     // warm amber
      [168, 85, 247],     // purple glow
    ];

    // Dynamic particle density
    const totalCount = isMobile ? 140 : 380;
    const focalLength = 650;
    const galaxyRadius = Math.min(width, height) * 0.55;

    // Word target mappings
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

    const particles: Particle[] = Array.from({ length: totalCount }, (_, i) => {
      const armAngle = Math.random() * Math.PI * 2;
      const distFromCenter = Math.pow(Math.random(), 0.55) * galaxyRadius;
      const spiralAngle = armAngle + distFromCenter * 0.006;
      const scatter = (Math.random() - 0.5) * distFromCenter * 0.35;

      const x = Math.cos(spiralAngle) * distFromCenter + scatter;
      const y = Math.sin(spiralAngle) * distFromCenter + scatter;
      const z = (Math.random() - 0.5) * galaxyRadius * 0.4;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      const layerRand = Math.random();
      const layer: 'bg' | 'mid' | 'fg' = layerRand < 0.3 ? 'bg' : layerRand < 0.8 ? 'mid' : 'fg';

      return {
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 0.04,
        vy: (Math.random() - 0.5) * 0.04,
        vz: (Math.random() - 0.5) * 0.02,
        size: layer === 'fg' ? Math.random() * 2.8 + 1.2 : layer === 'mid' ? Math.random() * 1.5 + 0.6 : Math.random() * 0.8 + 0.2,
        baseAlpha: layer === 'fg' ? Math.random() * 0.4 + 0.5 : layer === 'mid' ? Math.random() * 0.3 + 0.2 : Math.random() * 0.2 + 0.05,
        color,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: (0.00015 + Math.random() * 0.0004) * (Math.random() < 0.5 ? 1 : -1),
        orbitRadius: distFromCenter,
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
      if (!reduceMotion && elapsedSeconds > 0.4 && elapsedSeconds < 4.8) {
        if (elapsedSeconds < 1.8) {
          // Ramp up: disperse -> text
          initialFormationWeight = (elapsedSeconds - 0.4) / 1.4;
        } else if (elapsedSeconds < 3.2) {
          // Hold formation
          initialFormationWeight = 1.0;
        } else {
          // Dissolve: text -> disperse
          initialFormationWeight = 1.0 - (elapsedSeconds - 3.2) / 1.6;
        }
      }
      initialFormationWeight = Math.max(0, Math.min(1, initialFormationWeight));

      // Scroll-driven word formation calculation
      let scrollActiveWord = '';
      let scrollFormationWeight = 0;

      if (!reduceMotion && initialFormationWeight < 0.01 && currentScrollRatio > 0.15) {
        // Define scroll ratio triggers for words
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
            scrollFormationWeight = Math.sin(progress * Math.PI); // smooth bell curve 0 -> 1 -> 0
            break;
          }
        }
      }

      // Central core radial ambient glow
      const centerX = width / 2;
      const centerY = height * 0.42;

      const centralGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.min(width, height) * 0.6
      );
      centralGlow.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
      centralGlow.addColorStop(0.35, 'rgba(59, 130, 246, 0.025)');
      centralGlow.addColorStop(0.7, 'rgba(6, 182, 212, 0.01)');
      centralGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = centralGlow;
      ctx.fillRect(0, 0, width, height);

      // Mouse parallax offset calculation
      const parallaxX = isMobile ? 0 : (mouseX - width / 2) * 0.012;
      const parallaxY = isMobile ? 0 : (mouseY - height / 2) * 0.012;

      // Sort particles by Z-depth (back-to-front rendering)
      const sortedParticles = [...particles].sort((a, b) => a.z - b.z);

      sortedParticles.forEach((p, idx) => {
        if (!reduceMotion) {
          // Orbital physics
          p.orbitAngle += p.orbitSpeed;
          p.x += Math.cos(p.orbitAngle) * 0.06;
          p.y += Math.sin(p.orbitAngle) * 0.06;

          // Slow drift motion
          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;

          // Soft boundary wrap
          if (Math.abs(p.x) > galaxyRadius * 1.6) p.vx *= -1;
          if (Math.abs(p.y) > galaxyRadius * 1.6) p.vy *= -1;
          if (Math.abs(p.z) > galaxyRadius * 0.6) p.vz *= -1;
        }

        // 3D perspective projection
        const scale = focalLength / (focalLength + p.z);
        let screenX = centerX + (p.x + parallaxX) * scale;
        let screenY = centerY + (p.y + parallaxY) * scale;

        // Apply Initial Formation Target Morphing
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

        // Depth-aware opacity & soft twinkling
        const depthFactor = Math.max(0.15, Math.min(1, scale));
        const twinkle = reduceMotion ? 1 : 0.75 + 0.25 * Math.sin(time * 2.2 + p.orbitAngle * 8);
        const alpha = p.baseAlpha * depthFactor * twinkle;

        if (alpha < 0.015) return;
        if (screenX < -30 || screenX > width + 30 || screenY < -30 || screenY > height + 30) return;

        const [r, g, b] = p.color;

        // Soft bloom aura for foreground & bright particles
        if (p.layer === 'fg' && projectedSize > 1.2) {
          ctx.beginPath();
          ctx.arc(screenX, screenY, projectedSize * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.09})`;
          ctx.fill();
        }

        // Core particle point
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
