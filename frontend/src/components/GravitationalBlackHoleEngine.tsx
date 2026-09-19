import React, { useEffect, useRef } from 'react';

interface Particle {
  type: 'accretion' | 'jet' | 'spiral' | 'beacon';
  angle: number;
  radius: number;
  baseRadius: number;
  angularSpeed: number;
  radialSpeed: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  color: [number, number, number];
  targetColor: [number, number, number];
  tilt: number;
  z: number;
  vz: number;
  pulsePhase: number;
}

interface GravitationalBlackHoleEngineProps {
  activeStep: number;        // 0, 1, 2, 3
  stepProgress: number;      // 0.0 to 1.0 within active step
  totalProgress: number;     // 0.0 to 4.0 across whole sequence
}

// Color Palettes corresponding to each Capability Step:
// 0: COUNCIL (Cyan & Electric Blue)
// 1: SYNTHESIS (Solar Gold & Amber)
// 2: CONTEXT (Emerald Aurora & Teal)
// 3: HYBRID (Royal Violet & Magenta)
const STEP_PALETTES: [number, number, number][][] = [
  // 0: Council
  [[56, 189, 248], [14, 165, 233], [96, 165, 250], [255, 255, 255], [186, 230, 253]],
  // 1: Synthesis
  [[251, 191, 36], [245, 158, 11], [254, 243, 199], [255, 255, 255], [217, 119, 6]],
  // 2: Context
  [[16, 185, 129], [52, 211, 153], [45, 212, 191], [255, 255, 255], [110, 231, 183]],
  // 3: Hybrid
  [[168, 85, 247], [192, 132, 252], [236, 72, 153], [255, 255, 255], [244, 63, 94]]
];

export const GravitationalBlackHoleEngine: React.FC<GravitationalBlackHoleEngineProps> = ({
  activeStep,
  stepProgress,
  totalProgress
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Use ref to bridge continuous animation loop with changing props without rebuilding particle pool
  const propsRef = useRef({ activeStep, stepProgress, totalProgress });
  useEffect(() => {
    propsRef.current = { activeStep, stepProgress, totalProgress };
  }, [activeStep, stepProgress, totalProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const isMobile = window.innerWidth < 768;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 580);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 580);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 580;
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

    // High Density Astra 6 Particle Pool
    const particleCount = isMobile ? 550 : 1350;
    const particles: Particle[] = [];

    const getPalette = (step: number) => STEP_PALETTES[step % STEP_PALETTES.length];

    for (let i = 0; i < particleCount; i++) {
      let type: Particle['type'] = 'accretion';
      if (i < particleCount * 0.55) {
        type = 'accretion';
      } else if (i < particleCount * 0.78) {
        type = 'spiral';
      } else if (i < particleCount * 0.95) {
        type = 'jet';
      } else {
        type = 'beacon';
      }

      const initialPalette = getPalette(propsRef.current.activeStep);
      const color = initialPalette[Math.floor(Math.random() * initialPalette.length)];
      let baseRadius = 48 + Math.random() * 210;
      let size = Math.random() * 1.6 + 0.6;
      let alpha = Math.random() * 0.6 + 0.3;

      if (type === 'beacon') {
        size = Math.random() * 3.2 + 2.2;
        alpha = Math.random() * 0.4 + 0.6;
        baseRadius = 70 + Math.random() * 190;
      } else if (type === 'jet') {
        size = Math.random() * 1.4 + 0.5;
        alpha = Math.random() * 0.5 + 0.25;
        baseRadius = 25 + Math.random() * 65;
      } else if (type === 'spiral') {
        baseRadius = 110 + Math.random() * 240;
      }

      particles.push({
        type,
        angle: Math.random() * Math.PI * 2,
        radius: baseRadius,
        baseRadius,
        angularSpeed: (0.012 + Math.random() * 0.022) * (Math.random() < 0.15 ? -1 : 1),
        radialSpeed: 0.18 + Math.random() * 0.38,
        size,
        alpha,
        baseAlpha: alpha,
        color: [...color],
        targetColor: [...color],
        tilt: -0.32 + (Math.random() - 0.5) * 0.18,
        z: (Math.random() - 0.5) * 140,
        vz: (Math.random() - 0.5) * 1.8,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    let time = 0;
    let lastStep = propsRef.current.activeStep;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      const { activeStep: currStep } = propsRef.current;

      // When step changes, assign new target colors for smooth morphing
      if (currStep !== lastStep) {
        lastStep = currStep;
        const newPalette = getPalette(currStep);
        particles.forEach(p => {
          const col = newPalette[Math.floor(Math.random() * newPalette.length)];
          p.targetColor = col;
        });
      }

      // Smooth mouse lerp with spring physics
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const centerX = width * 0.48;
      const centerY = height * 0.48;

      const mouseOffsetX = (mouseX - width / 2) * 0.05;
      const mouseOffsetY = (mouseY - height / 2) * 0.05;

      // Dynamic Event Horizon Radius with rhythmic breathing
      const eventHorizonRadius = 42 + Math.sin(time * 2.2) * 2.5;
      const diskTilt = -0.32 + mouseOffsetY * 0.003;

      // Color theme interpolation
      const currentPalette = getPalette(currStep);
      const [cr, cg, cb] = currentPalette[0];

      // --- 1. DEEP SPACE GRAVITATIONAL LENSING & SINGULARITY CORE ---
      ctx.save();
      ctx.translate(centerX + mouseOffsetX, centerY + mouseOffsetY);

      // Multi-spectral Relativistic Lensing Glow
      const lensingAura = ctx.createRadialGradient(0, 0, eventHorizonRadius * 0.6, 0, 0, 240);
      lensingAura.addColorStop(0, 'rgba(0, 0, 0, 0.98)');
      lensingAura.addColorStop(0.2, `rgba(${cr}, ${cg}, ${cb}, 0.32)`);
      lensingAura.addColorStop(0.45, `rgba(${currentPalette[1][0]}, ${currentPalette[1][1]}, ${currentPalette[1][2]}, 0.16)`);
      lensingAura.addColorStop(0.72, 'rgba(56, 189, 248, 0.06)');
      lensingAura.addColorStop(1, 'transparent');

      ctx.fillStyle = lensingAura;
      ctx.beginPath();
      ctx.arc(0, 0, 250, 0, Math.PI * 2);
      ctx.fill();

      // Dual Intersecting Elliptical Orbital Trajectory Guides (Astra Reference Mockup)
      ctx.save();
      ctx.rotate(diskTilt);

      // Inner Accretion Golden Trace Ring
      ctx.beginPath();
      ctx.ellipse(0, 0, 155, 52, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.55)`;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.85)`;
      ctx.shadowBlur = 16;
      ctx.stroke();

      // Outer Tilted Cyan Guide Trajectory
      ctx.beginPath();
      ctx.ellipse(0, 0, 205, 68, 0.16, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.75)';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Outer Dashed Trajectory Ring
      ctx.beginPath();
      ctx.ellipse(0, 0, 245, 84, -0.09, 0, Math.PI * 2);
      ctx.setLineDash([4, 10]);
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.3)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Black Hole Singularity Core (Absolute Event Horizon)
      ctx.beginPath();
      ctx.arc(0, 0, eventHorizonRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#010103';
      ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.95)`;
      ctx.shadowBlur = 24;
      ctx.fill();

      // Sharp Photon Sphere Ring Boundary
      ctx.beginPath();
      ctx.arc(0, 0, eventHorizonRadius + 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Prominent Orbiting ACTIVE Beacon (As seen in Astra screenshot)
      const beaconAngle = time * 0.85;
      const beaconRx = 155;
      const beaconRy = 52;
      const beaconX = Math.cos(beaconAngle) * beaconRx;
      const beaconY = Math.sin(beaconAngle) * beaconRy;

      // Rotate with accretion tilt
      const bRotCos = Math.cos(diskTilt);
      const bRotSin = Math.sin(diskTilt);
      const beaconFinalX = beaconX * bRotCos - beaconY * bRotSin;
      const beaconFinalY = beaconX * bRotSin + beaconY * bRotCos;

      // Glow Halo
      const beaconGlow = ctx.createRadialGradient(beaconFinalX, beaconFinalY, 0, beaconFinalX, beaconFinalY, 18);
      beaconGlow.addColorStop(0, 'rgba(251, 191, 36, 0.95)');
      beaconGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.4)');
      beaconGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = beaconGlow;
      ctx.beginPath();
      ctx.arc(beaconFinalX, beaconFinalY, 18, 0, Math.PI * 2);
      ctx.fill();

      // Solid Core
      ctx.beginPath();
      ctx.arc(beaconFinalX, beaconFinalY, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.fill();

      // "ACTIVE" Tag above beacon when on the front side of orbit
      if (Math.sin(beaconAngle) > -0.2) {
        ctx.font = '600 8px var(--font-mono, monospace)';
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center';
        ctx.fillText('ACTIVE', beaconFinalX, beaconFinalY - 10);
      }

      ctx.restore();

      // --- 2. RELATIVISTIC POLAR STREAM FILAMENT ---
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 7]);
      ctx.beginPath();
      ctx.moveTo(centerX + mouseOffsetX, 24);
      ctx.bezierCurveTo(
        centerX + mouseOffsetX + 36, height * 0.28,
        centerX + mouseOffsetX - 36, height * 0.72,
        centerX + mouseOffsetX, height - 24
      );
      ctx.stroke();
      ctx.restore();

      // --- 3. HIGH-PERFORMANCE ASTRA 6 PARTICLE DYNAMICS ---
      particles.forEach(p => {
        if (!reduceMotion) {
          // Color Lerping towards target step palette
          p.color[0] += (p.targetColor[0] - p.color[0]) * 0.04;
          p.color[1] += (p.targetColor[1] - p.color[1]) * 0.04;
          p.color[2] += (p.targetColor[2] - p.color[2]) * 0.04;

          p.pulsePhase += 0.03;

          // Keplerian velocity: inner particles orbit faster than outer particles
          const proximity = Math.max(0.18, (p.radius - eventHorizonRadius) / 180);
          const currentAngularSpeed = p.angularSpeed * (1.8 / proximity);
          p.angle += currentAngularSpeed;

          if (p.type === 'jet') {
            // Relativistic jet: particles stream outward along Z axis (polar)
            p.z += p.vz * 1.5;
            p.radius += 0.15;
            if (Math.abs(p.z) > 160) {
              p.z = (Math.random() - 0.5) * 20;
              p.radius = 28 + Math.random() * 45;
            }
          } else {
            // Accretion spiral pull
            p.radius -= p.radialSpeed * 0.32;
            if (p.radius < eventHorizonRadius) {
              p.radius = p.baseRadius + (Math.random() - 0.5) * 30;
            }
          }
        }

        // 3D Elliptical Projection
        const cosA = Math.cos(p.angle);
        const sinA = Math.sin(p.angle);
        const rx = p.radius * 1.28;
        const ry = p.radius * 0.42;

        const rotCos = Math.cos(p.tilt + mouseOffsetY * 0.002);
        const rotSin = Math.sin(p.tilt + mouseOffsetY * 0.002);

        const px = cosA * rx;
        const py = sinA * ry;

        const posX = centerX + mouseOffsetX + (px * rotCos - py * rotSin);
        const posY = centerY + mouseOffsetY + (px * rotSin + py * rotCos) + (p.type === 'jet' ? p.z * 0.45 : 0);

        // Relativistic Beaming & Depth Shading
        const depth = Math.sin(p.angle);
        const alphaFactor = depth > 0 ? 1.0 : 0.38; // Approaching side glows intensely
        const pulse = 0.85 + Math.sin(p.pulsePhase) * 0.15;

        const r = Math.round(p.color[0]);
        const g = Math.round(p.color[1]);
        const b = Math.round(p.color[2]);

        // Render Beacon / Constellation Nodes
        if (p.type === 'beacon') {
          // Outer Glow
          ctx.beginPath();
          ctx.arc(posX, posY, p.size * 3.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.16 * alphaFactor * pulse})`;
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(posX, posY, p.size * pulse, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * alphaFactor})`;
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Standard Micro-Stardust & Accretion Points
          ctx.beginPath();
          ctx.arc(posX, posY, Math.max(0.4, p.size), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * alphaFactor * pulse})`;
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animId);
    };
  }, []); // Run once persistently so particle physics run without interruption

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
