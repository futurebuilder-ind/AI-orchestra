import React, { useEffect, useRef } from 'react';

interface Particle {
  angle: number;
  radius: number;
  angularSpeed: number;
  radialSpeed: number;
  baseRadius: number;
  size: number;
  alpha: number;
  color: [number, number, number];
  isPhoton: boolean;
  tilt: number;
  z: number;
  burstProgress: number;
  burstTargetX: number;
  burstTargetY: number;
}

interface Point2D {
  x: number;
  y: number;
}

interface GravitationalBlackHoleEngineProps {
  activeStep: number;        // 0, 1, 2, 3
  stepProgress: number;      // 0.0 to 1.0 within active step
  totalProgress: number;     // 0.0 to 3.0 across whole section
}

// Sample point-field targets from offscreen rendered text
const sampleTitleTargets = (text: string, count: number, canvasWidth: number): Point2D[] => {
  const offscreen = document.createElement('canvas');
  const w = (offscreen.width = 640);
  const h = (offscreen.height = 120);
  const ctx = offscreen.getContext('2d');
  if (!ctx) return Array.from({ length: count }, () => ({ x: 0, y: 0 }));

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 38px "Geist", "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);

  const imgData = ctx.getImageData(0, 0, w, h);
  const points: Point2D[] = [];
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / (count * 10))));

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4;
      if (imgData.data[idx + 3] > 128) {
        const scale = Math.min(canvasWidth, 680) / 720;
        points.push({
          x: (x - w / 2) * scale,
          y: (y - h / 2) * scale
        });
      }
    }
  }

  if (points.length === 0) return Array.from({ length: count }, () => ({ x: 0, y: 0 }));

  const targets: Point2D[] = [];
  for (let i = 0; i < count; i++) {
    const pt = points[i % points.length];
    targets.push({
      x: pt.x + (Math.random() - 0.5) * 3,
      y: pt.y + (Math.random() - 0.5) * 3
    });
  }
  return targets;
};

const STEP_TITLES = [
  'MULTI-AGENT REASONING',
  'MODEL COMPARISON & CONSENSUS',
  'FILE & CONTEXT INTELLIGENCE',
  'HYBRID CLOUD & LOCAL ENGINE'
];

export const GravitationalBlackHoleEngine: React.FC<GravitationalBlackHoleEngineProps> = ({
  activeStep,
  stepProgress,
  totalProgress
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const isMobile = window.innerWidth < 768;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 560);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 560);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 560;
      updateTextTargets();
    };
    window.addEventListener('resize', handleResize);

    // Mouse tracking with smooth lerping
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;
    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };
    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Text Target Maps
    let titleTargetMap: Record<number, Point2D[]> = {};
    const particleCount = isMobile ? 320 : 680;

    const updateTextTargets = () => {
      titleTargetMap = {
        0: sampleTitleTargets(STEP_TITLES[0], particleCount, width),
        1: sampleTitleTargets(STEP_TITLES[1], particleCount, width),
        2: sampleTitleTargets(STEP_TITLES[2], particleCount, width),
        3: sampleTitleTargets(STEP_TITLES[3], particleCount, width)
      };
    };
    updateTextTargets();

    // Palettes matching reference image:
    // Gold/Amber accretion disc + Cyan/Electric blue spiral arm + Violet accents + Photon white
    const amberColors: [number, number, number][] = [
      [254, 243, 199], [251, 191, 36], [245, 158, 11], [217, 119, 6], [255, 255, 255]
    ];
    const cyanColors: [number, number, number][] = [
      [207, 250, 254], [6, 182, 212], [56, 189, 248], [59, 130, 246], [255, 255, 255]
    ];
    const violetColors: [number, number, number][] = [
      [233, 213, 255], [192, 132, 252], [168, 85, 247], [147, 51, 234], [255, 255, 255]
    ];

    // Initialize Persistent Particle Pool
    const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => {
      const isPhoton = Math.random() < 0.12;
      const paletteChoice = i % 3 === 0 ? cyanColors : i % 3 === 1 ? amberColors : violetColors;
      const color = paletteChoice[Math.floor(Math.random() * paletteChoice.length)];
      const baseRadius = 45 + Math.random() * 190;

      return {
        angle: Math.random() * Math.PI * 2,
        radius: baseRadius,
        baseRadius,
        angularSpeed: (0.012 + Math.random() * 0.02) * (Math.random() < 0.2 ? -1 : 1),
        radialSpeed: 0.2 + Math.random() * 0.4,
        size: isPhoton ? Math.random() * 2.8 + 1.2 : Math.random() * 1.5 + 0.6,
        alpha: isPhoton ? Math.random() * 0.4 + 0.6 : Math.random() * 0.5 + 0.2,
        color,
        isPhoton,
        tilt: -0.32 + (Math.random() - 0.5) * 0.15,
        z: (Math.random() - 0.5) * 120,
        burstProgress: 0,
        burstTargetX: 0,
        burstTargetY: 0
      };
    });

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      // Mouse Lerp
      mouseX += (targetMouseX - mouseX) * 0.04;
      mouseY += (targetMouseY - mouseY) * 0.04;

      const centerX = width * 0.48;
      const centerY = height * 0.48;

      const mouseOffsetX = (mouseX - width / 2) * 0.04;
      const mouseOffsetY = (mouseY - height / 2) * 0.04;

      // Determine Particle Typography Formation Window
      // At peak of stepProgress (0.45 to 0.82), particles form the title
      let typographyWeight = 0;
      if (stepProgress >= 0.42 && stepProgress <= 0.88) {
        const peakRange = 0.88 - 0.42;
        const norm = (stepProgress - 0.42) / peakRange;
        typographyWeight = Math.sin(norm * Math.PI); // Smooth in and out
      }
      const targets = titleTargetMap[activeStep] || [];

      // Accretion Disc Pulsing Radius
      const eventHorizonRadius = 42 + Math.sin(time * 2) * 2;
      const discTilt = -0.34 + mouseOffsetY * 0.003;

      // --- 1. RENDER GRAVITATIONAL LENSING AURA & EVENT HORIZON ---
      ctx.save();
      ctx.translate(centerX + mouseOffsetX, centerY + mouseOffsetY);

      // Deep Space Gravitational Glow
      const lensingGlow = ctx.createRadialGradient(0, 0, eventHorizonRadius * 0.8, 0, 0, 220);
      lensingGlow.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      lensingGlow.addColorStop(0.24, 'rgba(251, 191, 36, 0.28)');
      lensingGlow.addColorStop(0.48, 'rgba(56, 189, 248, 0.14)');
      lensingGlow.addColorStop(0.72, 'rgba(168, 85, 247, 0.06)');
      lensingGlow.addColorStop(1, 'transparent');

      ctx.fillStyle = lensingGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 230, 0, Math.PI * 2);
      ctx.fill();

      // Relativistic Lensing Arcs (Accretion Rings)
      ctx.save();
      ctx.rotate(discTilt);

      // Golden Accretion Ring 1
      ctx.beginPath();
      ctx.ellipse(0, 0, 150, 48, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Cyan Accretion Ring 2
      ctx.beginPath();
      ctx.ellipse(0, 0, 190, 62, 0.12, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Outer Filament Ring 3
      ctx.beginPath();
      ctx.ellipse(0, 0, 230, 78, -0.08, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.25)';
      ctx.lineWidth = 0.9;
      ctx.shadowBlur = 0;
      ctx.stroke();
      ctx.restore();

      // Pure Black Event Horizon Core
      ctx.beginPath();
      ctx.arc(0, 0, eventHorizonRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#020204';
      ctx.shadowColor = 'rgba(251, 191, 36, 0.9)';
      ctx.shadowBlur = 22;
      ctx.fill();

      // Sharp Photon Ring Boundary
      ctx.beginPath();
      ctx.arc(0, 0, eventHorizonRadius + 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.restore();

      // --- 2. VERTICAL GRAVITATIONAL FILAMENTS STREAMING BETWEEN NODES ---
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(centerX, 20);
      ctx.bezierCurveTo(centerX + 30, height * 0.25, centerX - 30, height * 0.75, centerX, height - 20);
      ctx.stroke();
      ctx.restore();

      // --- 3. PARTICLES PHYSICS & TYPOGRAPHY FORMATION ---
      particles.forEach((p, idx) => {
        if (!reduceMotion) {
          // Gravitational angular acceleration near event horizon
          const proximity = Math.max(0.2, (p.radius - eventHorizonRadius) / 160);
          const currentAngularSpeed = p.angularSpeed * (1.6 / proximity);
          p.angle += currentAngularSpeed;

          // Inward spiral attraction
          p.radius -= p.radialSpeed * 0.4;
          if (p.radius < eventHorizonRadius) {
            // Relativistic slingshot re-emission into outer accretion belt
            p.radius = p.baseRadius + (Math.random() - 0.5) * 20;
          }
        }

        // Elliptical coordinate calculation with accretion tilt
        const cosA = Math.cos(p.angle);
        const sinA = Math.sin(p.angle);
        const rx = p.radius * 1.25;
        const ry = p.radius * 0.42;

        // Rotating with accretion tilt
        const rotCos = Math.cos(p.tilt + mouseOffsetY * 0.002);
        const rotSin = Math.sin(p.tilt + mouseOffsetY * 0.002);

        const px = cosA * rx;
        const py = sinA * ry;

        const orbitalX = centerX + mouseOffsetX + (px * rotCos - py * rotSin);
        const orbitalY = centerY + mouseOffsetY + (px * rotSin + py * rotCos);

        let finalX = orbitalX;
        let finalY = orbitalY;

        // Form Title Typography when typographyWeight > 0
        if (typographyWeight > 0.02 && targets.length > 0) {
          const target = targets[idx % targets.length];
          const textX = centerX + target.x;
          const textY = centerY + 160 + target.y; // Position title below black hole
          const ease = Math.pow(typographyWeight, 1.6);
          finalX = orbitalX * (1 - ease) + textX * ease;
          finalY = orbitalY * (1 - ease) + textY * ease;
        }

        // Depth & Twinkle
        const depth = Math.sin(p.angle);
        const alphaFactor = depth > 0 ? 1.0 : 0.45; // Relativistic beaming
        const [r, g, b] = p.color;

        // Render Photon Glow Aura
        if (p.isPhoton) {
          ctx.beginPath();
          ctx.arc(finalX, finalY, p.size * 3.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.18 * alphaFactor})`;
          ctx.fill();
        }

        // Render Core Particle Point
        ctx.beginPath();
        ctx.arc(finalX, finalY, Math.max(0.5, p.size), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * alphaFactor})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeStep, stepProgress, totalProgress]);

  return (
    <div className="gravitational-engine-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};
