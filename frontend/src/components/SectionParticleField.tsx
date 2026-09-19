import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  color: [number, number, number];
  life: number;
  maxLife: number;
}

interface SectionParticleFieldProps {
  particleCount?: number;
  colorPalette?: 'cyan' | 'purple' | 'mixed';
}

export const SectionParticleField: React.FC<SectionParticleFieldProps> = ({
  particleCount = 120,
  colorPalette = 'mixed'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let mouseX = -1000;
    let mouseY = -1000;
    let targetMouseX = -1000;
    let targetMouseY = -1000;

    const isMobile = window.innerWidth <= 767;
    const count = isMobile ? Math.floor(particleCount * 0.5) : particleCount;

    // Color palettes
    const cyanColors: [number, number, number][] = [
      [56, 189, 248],   // sky-400
      [14, 165, 233],   // sky-500
      [125, 211, 252],  // sky-300
      [186, 230, 253],  // sky-200
      [255, 255, 255],
    ];
    const purpleColors: [number, number, number][] = [
      [139, 92, 246],   // violet-500
      [167, 139, 250],  // violet-400
      [196, 181, 253],  // violet-300
      [129, 140, 248],  // indigo-400
      [255, 255, 255],
    ];
    const mixedColors: [number, number, number][] = [...cyanColors, ...purpleColors];

    const palette = colorPalette === 'cyan' ? cyanColors : colorPalette === 'purple' ? purpleColors : mixedColors;

    let width: number;
    let height: number;

    const resize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    };

    resize();

    // Create particles
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * (width || 800),
      y: Math.random() * (height || 600),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.8 + 0.4,
      baseAlpha: Math.random() * 0.35 + 0.08,
      color: palette[Math.floor(Math.random() * palette.length)],
      life: Math.random() * 600,
      maxLife: 400 + Math.random() * 400,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container!.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      targetMouseX = -1000;
      targetMouseY = -1000;
    };

    if (!isMobile) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    window.addEventListener('resize', resize);

    let time = 0;

    const render = () => {
      if (!ctx || !width || !height) {
        animFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.06;
      mouseY += (targetMouseY - mouseY) * 0.06;

      const mouseInfluenceRadius = 180;
      const mouseRepelStrength = 0.8;

      particles.forEach((p) => {
        // Lifecycle
        p.life += 1;
        if (p.life > p.maxLife) {
          p.life = 0;
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.vx = (Math.random() - 0.5) * 0.3;
          p.vy = (Math.random() - 0.5) * 0.3;
        }

        // Mouse interaction: gentle attraction/swirl
        if (mouseX > -500 && mouseY > -500) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseInfluenceRadius && dist > 1) {
            const force = (1 - dist / mouseInfluenceRadius) * mouseRepelStrength;
            // Swirl effect — perpendicular push + slight attraction
            const angle = Math.atan2(dy, dx);
            const swirlAngle = angle + Math.PI * 0.5; // perpendicular
            p.vx += Math.cos(swirlAngle) * force * 0.15;
            p.vy += Math.sin(swirlAngle) * force * 0.15;
            // Gentle attraction toward cursor
            p.vx -= (dx / dist) * force * 0.03;
            p.vy -= (dy / dist) * force * 0.03;
          }
        }

        // Apply velocity with drift
        p.x += p.vx + Math.sin(time * 0.5 + p.y * 0.005) * 0.08;
        p.y += p.vy + Math.cos(time * 0.3 + p.x * 0.005) * 0.06;

        // Damping
        p.vx *= 0.985;
        p.vy *= 0.985;

        // Wrap edges
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Lifecycle fade
        const lifePct = p.life / p.maxLife;
        const lifeFade = lifePct < 0.1 ? lifePct / 0.1 : lifePct > 0.85 ? (1 - lifePct) / 0.15 : 1;

        // Twinkle
        const twinkle = 0.7 + 0.3 * Math.sin(time * 2.2 + p.x * 0.02 + p.y * 0.02);

        const alpha = p.baseAlpha * lifeFade * twinkle;

        if (alpha < 0.01) return;

        const [r, g, b] = p.color;

        // Soft bloom for larger particles
        if (p.size > 1.0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.06})`;
          ctx.fill();
        }

        // Core particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
      });

      // Draw faint connection lines between nearby particles
      const connectionDist = isMobile ? 60 : 90;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const lineAlpha = (1 - dist / connectionDist) * 0.06;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(148, 163, 184, ${lineAlpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
      if (!isMobile && container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [particleCount, colorPalette]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
