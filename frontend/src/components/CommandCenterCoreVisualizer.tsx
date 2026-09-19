import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  color: [number, number, number];
  isPhoton: boolean;
}

interface CommandCenterCoreVisualizerProps {
  onSelectPrompt?: (prompt: string) => void;
}

export const CommandCenterCoreVisualizer: React.FC<CommandCenterCoreVisualizerProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 440);

    // Mouse lerp tracking
    let targetMouseX = width / 2;
    let targetMouseY = height * 0.45;
    let mouseX = targetMouseX;
    let mouseY = targetMouseY;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 440;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Subtle sophisticated micro-particle color palette
    const colorPalette: [number, number, number][] = [
      [56, 189, 248],   // cyan
      [167, 139, 250],  // violet
      [251, 191, 36],   // amber
      [255, 255, 255],  // white
      [96, 165, 250],   // sky blue
    ];

    // Initialize persistent organic ambient particle pool
    const particleCount = prefersReducedMotion ? 50 : 220;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const isPhoton = Math.random() < 0.12;
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      particles.push({
        x: (Math.random() - 0.5) * width * 1.3,
        y: (Math.random() - 0.5) * height * 1.15,
        z: Math.random(),
        vx: (Math.random() - 0.5) * (isPhoton ? 0.6 : 0.3),
        vy: (Math.random() - 0.5) * (isPhoton ? 0.6 : 0.3),
        radius: isPhoton ? Math.random() * 2.0 + 1.2 : Math.random() * 1.3 + 0.5,
        baseAlpha: isPhoton ? 0.8 : Math.random() * 0.35 + 0.15,
        color: isPhoton ? [255, 255, 255] : color,
        isPhoton
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerping
      mouseX += (targetMouseX - mouseX) * 0.045;
      mouseY += (targetMouseY - mouseY) * 0.045;

      const centerX = width / 2;
      const centerY = height * 0.45;

      const parallaxX = (mouseX - width / 2) * 0.015;
      const parallaxY = (mouseY - height / 2) * 0.015;

      // Render & update ambient particle field
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges gracefully
        if (p.x < -width * 0.6) p.x = width * 0.6;
        if (p.x > width * 0.6) p.x = -width * 0.6;
        if (p.y < -height * 0.55) p.y = height * 0.55;
        if (p.y > height * 0.55) p.y = -height * 0.55;

        // Screen position with depth parallax
        const screenX = centerX + p.x + parallaxX * (0.5 + p.z);
        const screenY = centerY + p.y + parallaxY * (0.5 + p.z);

        // Subtle organic reaction to cursor position
        const dx = mouseX - screenX;
        const dy = mouseY - screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130 && dist > 10) {
          const pull = (1 - dist / 130) * 0.22;
          p.x += (dx / dist) * pull;
          p.y += (dy / dist) * pull;
        }

        // Render particle
        if (screenX > 0 && screenX < width && screenY > 0 && screenY < height) {
          const [r, g, b] = p.color;
          ctx.beginPath();
          ctx.arc(screenX, screenY, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.baseAlpha})`;
          ctx.fill();

          // Photons get soft bloom
          if (p.isPhoton) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, p.radius * 2.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(56, 189, 248, 0.22)`;
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="command-core-visualizer-container">
      {/* Background Interactive Canvas */}
      <canvas ref={canvasRef} className="command-core-canvas" />

      {/* Central Typography Composition */}
      <div className="command-core-typography">
        <h1 className="command-core-title">
          <span className="title-ai">AI</span>
          <span className="title-orchestra">ORCHESTRA</span>
        </h1>

        <p className="command-core-tagline">
          One prompt. Multiple models. Unified reasoning.
        </p>
      </div>
    </div>
  );
};

