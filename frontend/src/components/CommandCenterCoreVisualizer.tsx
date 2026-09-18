import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: [number, number, number];
}

interface MoonOrb {
  angle: number;
  speed: number;
  radiusX: number;
  radiusY: number;
  tiltAngle: number;
  size: number;
  color: string;
}

export const CommandCenterCoreVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 440);

    let targetMouseX = width / 2;
    let targetMouseY = height / 2;
    let mouseX = width / 2;
    let mouseY = height / 2;

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

    // Dynamic particles
    const particleCount = 280;
    const cyanPalette: [number, number, number][] = [
      [255, 255, 255], [207, 250, 254], [6, 182, 212], [59, 130, 246]
    ];
    const amberPalette: [number, number, number][] = [
      [255, 255, 255], [254, 243, 199], [245, 158, 11], [251, 191, 36]
    ];

    const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => {
      const isCyan = i < particleCount / 2;
      const palette = isCyan ? cyanPalette : amberPalette;
      return {
        x: (Math.random() - 0.5) * width * 1.4,
        y: (Math.random() - 0.5) * height * 1.2,
        z: Math.random() * 400 - 200,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.5 + 0.25,
        color: palette[Math.floor(Math.random() * palette.length)]
      };
    });

    // Orbiting Moon Orbs along golden rings
    const moonOrbs: MoonOrb[] = [
      { angle: 0, speed: 0.008, radiusX: 180, radiusY: 65, tiltAngle: -0.2, size: 5, color: '#fef08a' },
      { angle: Math.PI * 0.7, speed: 0.006, radiusX: 230, radiusY: 85, tiltAngle: 0.15, size: 6.5, color: '#67e8f9' },
      { angle: Math.PI * 1.3, speed: 0.009, radiusX: 280, radiusY: 105, tiltAngle: -0.1, size: 4.5, color: '#fde047' },
    ];

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      // Mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      const centerX = width / 2;
      const centerY = height * 0.38;

      const parallaxX = (mouseX - width / 2) * 0.012;
      const parallaxY = (mouseY - height / 2) * 0.012;

      // --- RENDER DUST PARTICLES ---
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (Math.abs(p.x) > width * 0.8) p.vx *= -1;
        if (Math.abs(p.y) > height * 0.7) p.vy *= -1;

        const screenX = centerX + p.x + parallaxX;
        const screenY = centerY + p.y + parallaxY;

        if (screenX > 0 && screenX < width && screenY > 0 && screenY < height) {
          const [r, g, b] = p.color;
          ctx.beginPath();
          ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
          ctx.fill();
        }
      });

      // --- RENDER CONCENTRIC GOLDEN ORBITAL RINGS ---
      ctx.save();
      ctx.translate(centerX + parallaxX, centerY + parallaxY);

      const ringConfigs = [
        { rx: 170, ry: 60, tilt: -0.2, stroke: 'rgba(251, 191, 36, 0.35)' },
        { rx: 220, ry: 80, tilt: 0.15, stroke: 'rgba(245, 158, 11, 0.45)' },
        { rx: 275, ry: 100, tilt: -0.1, stroke: 'rgba(251, 191, 36, 0.25)' },
      ];

      ringConfigs.forEach(rc => {
        ctx.save();
        ctx.rotate(rc.tilt);
        ctx.beginPath();
        ctx.ellipse(0, 0, rc.rx, rc.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = rc.stroke;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      });

      // --- RENDER MOON ORBS ---
      moonOrbs.forEach(orb => {
        orb.angle += orb.speed;
        ctx.save();
        ctx.rotate(orb.tiltAngle);
        const ox = Math.cos(orb.angle) * orb.radiusX;
        const oy = Math.sin(orb.angle) * orb.radiusY;

        // Aura glow
        ctx.beginPath();
        ctx.arc(ox, oy, orb.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = orb.color;
        ctx.globalAlpha = 0.25;
        ctx.fill();

        // Core orb
        ctx.beginPath();
        ctx.arc(ox, oy, orb.size, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.restore();
      });

      // --- RENDER CENTRAL STARBURST FLARE ---
      ctx.rotate(time * 0.04);
      const flareRadius = 85;

      const starGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, flareRadius);
      starGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      starGrad.addColorStop(0.2, 'rgba(251, 191, 36, 0.5)');
      starGrad.addColorStop(0.6, 'rgba(6, 182, 212, 0.2)');
      starGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = starGrad;

      // Horizontal ray
      ctx.beginPath();
      ctx.ellipse(0, 0, 120, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vertical ray
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.5, 120, 0, 0, Math.PI * 2);
      ctx.fill();

      // Center Star Core
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 18;
      ctx.fill();

      ctx.restore();

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
    <div className="command-core-visualizer-container">
      {/* 4 Corner Telemetry Overlays */}
      <div className="telemetry-corner-item top-left-telemetry">
        <span>ORCHESTRATE</span>
        <span>REASON</span>
        <span>SYNTHESIZE</span>
        <span>CONSENSUS</span>
        <div className="telemetry-bar" />
      </div>

      <div className="telemetry-corner-item top-right-telemetry">
        <span>MULTI-MODEL</span>
        <span>INTELLIGENCE</span>
        <span>FOR A BRIGHTER</span>
        <span>TOMORROW</span>
      </div>

      <div className="telemetry-corner-item mid-right-telemetry">
        <span>IDEAS</span>
        <span>MODELS</span>
        <span>DATA</span>
        <span>PEOPLE</span>
        <div className="telemetry-bar" />
      </div>

      <div className="telemetry-corner-item bottom-right-telemetry">
        <span>BUILT</span>
        <span>FOR HUMAN</span>
        <span>POTENTIAL</span>
      </div>

      {/* Background Canvas */}
      <canvas ref={canvasRef} className="command-core-canvas" />

      {/* Central Title & Subtitle */}
      <div className="command-core-typography">
        <h1 className="command-core-title">
          <span className="title-ai">AI</span>
          <span className="title-gap" />
          <span className="title-orchestra">ORCHESTRA</span>
        </h1>
        <p className="command-core-subtitle">
          M U L T I - M O D E L &nbsp; I N T E L L I G E N C E , &nbsp; O R C H E S T R A T E D .
        </p>
      </div>
    </div>
  );
};
