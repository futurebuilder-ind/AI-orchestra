import React, { useEffect, useRef } from 'react';
import { EffectsConfig } from '../types';

interface CosmicBackgroundProps {
  effects?: EffectsConfig;
}

interface Particle {
  // Base Galaxy State (Hero scattered)
  baseX: number;
  baseY: number;
  baseZ: number;
  driftAngle: number;
  driftSpeed: number;
  isAmbientStar: boolean; // ~12% distant stars that remain scattered

  // Orbital / Black Hole State
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  orbitTilt: number;
  orbitLayer: 'bg' | 'mid' | 'fg';

  // Appearance
  size: number;
  baseAlpha: number;
  color: [number, number, number];
}

interface BokehDisc {
  radius: number;
  angle: number;
  speed: number;
  size: number;
  alpha: number;
  color: [number, number, number];
}

// Step Palettes corresponding to Council, Synthesis, Context, Hybrid
const STEP_COLORS: [number, number, number][] = [
  [56, 189, 248],  // Step 0: Council (Cyan)
  [251, 191, 36],  // Step 1: Synthesis (Solar Gold)
  [16, 185, 129],  // Step 2: Context (Emerald)
  [168, 85, 247]   // Step 3: Hybrid (Royal Violet)
];

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
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // Capture scroll from either window or the landing-mode-container
    const getScrollRatio = () => {
      const landingContainer = document.querySelector('.landing-mode-container');
      if (landingContainer && landingContainer.scrollHeight > landingContainer.clientHeight) {
        const max = Math.max(1, landingContainer.scrollHeight - landingContainer.clientHeight);
        return Math.min(1, Math.max(0, landingContainer.scrollTop / max));
      }
      const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const winHeight = window.innerHeight;
      const maxScroll = Math.max(1, docHeight - winHeight);
      return Math.min(1, Math.max(0, (window.scrollY || document.documentElement.scrollTop || 0) / maxScroll));
    };

    const handleScroll = () => {
      targetScrollRatio = getScrollRatio();
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    handleScroll();

    // High-density persistent particle pool
    const totalCount = isMobile ? 240 : 580;
    const focalLength = 680;

    // Rich color palette matching the screenshot (electric cyan, emerald, warm gold, azure, white)
    const palette: [number, number, number][] = [
      [255, 255, 255], // pure spark
      [207, 250, 254], // soft ice cyan
      [56, 189, 248],  // vibrant sky cyan
      [52, 211, 153],  // emerald teal
      [16, 185, 129],  // aurora green
      [251, 191, 36],  // solar gold
      [245, 158, 11],  // warm amber
      [147, 197, 253], // light azure
      [168, 85, 247]   // subtle violet
    ];

    // Initialize Single Persistent Particle Pool
    const particles: Particle[] = Array.from({ length: totalCount }, () => {
      const isAmbientStar = Math.random() < 0.12;

      // Galaxy scattered state across full hero canvas
      const baseX = Math.random() * width;
      const baseY = Math.random() * height;
      const baseZ = (Math.random() - 0.5) * 320;
      const driftAngle = Math.random() * Math.PI * 2;
      const driftSpeed = 0.003 + Math.random() * 0.007;

      // Multi-layer concentric orbital rings
      const layerRand = Math.random();
      const orbitLayer: 'bg' | 'mid' | 'fg' = layerRand < 0.28 ? 'bg' : layerRand < 0.72 ? 'mid' : 'fg';

      const rDist = Math.pow(Math.random(), 0.72);
      const minR = isMobile ? 32 : 46;
      const maxR = isMobile ? 240 : 390;
      const orbitRadius = minR + rDist * (maxR - minR);

      const orbitAngle = Math.random() * Math.PI * 2;
      const normalizedR = (orbitRadius - minR) / (maxR - minR);
      const baseOrbitSpeed = 0.006 + (1 - normalizedR) * 0.022;

      const color = palette[Math.floor(Math.random() * palette.length)];

      const size = orbitLayer === 'fg'
        ? Math.random() * 2.4 + 1.2
        : orbitLayer === 'mid'
        ? Math.random() * 1.5 + 0.6
        : Math.random() * 0.8 + 0.3;

      const baseAlpha = orbitLayer === 'fg'
        ? Math.random() * 0.35 + 0.55
        : orbitLayer === 'mid'
        ? Math.random() * 0.3 + 0.3
        : Math.random() * 0.25 + 0.12;

      return {
        baseX,
        baseY,
        baseZ,
        driftAngle,
        driftSpeed,
        isAmbientStar,
        orbitRadius,
        orbitAngle,
        orbitSpeed: baseOrbitSpeed,
        orbitTilt: -0.38 + (Math.random() - 0.5) * 0.12,
        orbitLayer,
        size,
        baseAlpha,
        color
      };
    });

    // Large Glowing Bokeh Bloom Discs (As seen in Astra reference screenshot)
    const bokehCount = isMobile ? 10 : 24;
    const bokehPalette: [number, number, number][] = [
      [56, 189, 248],  // cyan
      [52, 211, 153],  // emerald
      [251, 191, 36],  // gold
      [147, 197, 253], // icy azure
      [168, 85, 247]   // violet
    ];
    const bokehDiscs: BokehDisc[] = Array.from({ length: bokehCount }, () => ({
      radius: (isMobile ? 50 : 75) + Math.random() * (isMobile ? 120 : 230),
      angle: Math.random() * Math.PI * 2,
      speed: 0.004 + Math.random() * 0.008,
      size: (isMobile ? 12 : 20) + Math.random() * (isMobile ? 18 : 34),
      alpha: 0.08 + Math.random() * 0.14,
      color: bokehPalette[Math.floor(Math.random() * bokehPalette.length)]
    }));

    let time = 0;
    const activeColorLerp: [number, number, number] = [56, 189, 248];

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      // Smooth lerp mouse tracking
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Smooth bidirectional scroll scrubbing
      currentScrollRatio += (targetScrollRatio - currentScrollRatio) * 0.075;

      // Dynamic Precision Docking: Target .gravitational-canvas-stage in Features section
      const stage = document.querySelector('.gravitational-canvas-stage');
      const heroCenterX = width / 2;
      const heroCenterY = height * (isMobile ? 0.34 : 0.38);

      let stageX = isMobile ? width / 2 : width * 0.36;
      let stageY = height * 0.54;
      let stageInViewFactor = 0;
      let activeStepIdx = 0;

      if (stage) {
        const rect = stage.getBoundingClientRect();
        stageX = rect.left + rect.width / 2;
        stageY = rect.top + rect.height / 2;

        // When stage enters viewport from bottom to center
        const enterProgress = (window.innerHeight - rect.top) / (window.innerHeight * 0.65);
        stageInViewFactor = Math.max(0, Math.min(1, enterProgress));

        const stepAttr = stage.getAttribute('data-active-step');
        if (stepAttr !== null) {
          activeStepIdx = parseInt(stepAttr, 10) || 0;
        }
      }

      // Smooth blend between hero center and stage center
      const dockProgress = Math.max(currentScrollRatio, stageInViewFactor);
      const dockEase = dockProgress * dockProgress * (3 - 2 * dockProgress);

      const centerX = heroCenterX + (stageX - heroCenterX) * dockEase;
      const centerY = heroCenterY + (stageY - heroCenterY) * dockEase;

      // Transformation Stage Factors
      // Convergence starts as user scrolls away from top
      const convergence = Math.max(0, Math.min(1, dockProgress * 1.6));
      // Accretion forms black hole as stage enters view
      const accretionRaw = Math.max(0, Math.min(1, (dockProgress - 0.15) / 0.50));
      const accretion = accretionRaw * accretionRaw * (3 - 2 * accretionRaw);

      // Smooth color lerping to active capability step
      const targetStepColor = STEP_COLORS[activeStepIdx % STEP_COLORS.length];
      activeColorLerp[0] += (targetStepColor[0] - activeColorLerp[0]) * 0.05;
      activeColorLerp[1] += (targetStepColor[1] - activeColorLerp[1]) * 0.05;
      activeColorLerp[2] += (targetStepColor[2] - activeColorLerp[2]) * 0.05;
      const cr = Math.round(activeColorLerp[0]);
      const cg = Math.round(activeColorLerp[1]);
      const cb = Math.round(activeColorLerp[2]);

      // Subtle mouse parallax
      const parallaxX = isMobile ? 0 : (mouseX - width / 2) * 0.015;
      const parallaxY = isMobile ? 0 : (mouseY - height / 2) * 0.015;

      const diskTilt = -0.34;
      const eventHorizonRadius = Math.max(4, (isMobile ? 28 : 42) * accretion);
      const scaleFactor = isMobile ? 0.72 : 1.0;

      // =========================================================================
      // 1. ASTRA 6 DETAILED BLACK HOLE INFRASTRUCTURE (Matches User Screenshot)
      // =========================================================================
      if (accretion > 0.04) {
        // A. Relativistic Multi-Layer Lensing Aura
        const auraRadius = Math.min(width, height) * 0.42 * accretion;
        const lensingAura = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(10, auraRadius));
        lensingAura.addColorStop(0, `rgba(255, 255, 255, ${0.45 * accretion})`);
        lensingAura.addColorStop(0.18, `rgba(${cr}, ${cg}, ${cb}, ${0.28 * accretion})`);
        lensingAura.addColorStop(0.42, `rgba(56, 189, 248, ${0.14 * accretion})`);
        lensingAura.addColorStop(0.70, `rgba(52, 211, 153, ${0.06 * accretion})`);
        lensingAura.addColorStop(1, 'transparent');
        ctx.fillStyle = lensingAura;
        ctx.beginPath();
        ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // B. Relativistic Polar Stream Filament (Vertical dashed guide)
        ctx.save();
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.18 * accretion})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 7]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 260);
        ctx.bezierCurveTo(centerX + 32, centerY - 90, centerX - 32, centerY + 90, centerX, centerY + 260);
        ctx.stroke();
        ctx.restore();

        // C. Dual & Triple Intersecting Elliptical Orbital Trajectory Guides
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(diskTilt);

        // Inner Accretion Trace Ring (Golden/Step Accent with intense glow)
        ctx.beginPath();
        ctx.ellipse(0, 0, 160 * scaleFactor, 54 * scaleFactor, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${0.65 * accretion})`;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, 0.85)`;
        ctx.shadowBlur = 16;
        ctx.stroke();

        // Outer Tilted Cyan Guide Trajectory (Tilted cyan/emerald loop)
        ctx.beginPath();
        ctx.ellipse(0, 0, 215 * scaleFactor, 72 * scaleFactor, 0.16, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.48 * accretion})`;
        ctx.lineWidth = 1.3;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.75)';
        ctx.shadowBlur = 14;
        ctx.stroke();

        // Outer Dashed Trajectory Ring (Subtle purple/indigo guide)
        ctx.beginPath();
        ctx.ellipse(0, 0, 260 * scaleFactor, 90 * scaleFactor, -0.09, 0, Math.PI * 2);
        ctx.setLineDash([4, 10]);
        ctx.strokeStyle = `rgba(192, 132, 252, ${0.32 * accretion})`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();

        // D. Large Glowing Bokeh Bloom Discs (Astra Signature)
        bokehDiscs.forEach(b => {
          if (!reduceMotion) {
            b.angle += b.speed * (1 + accretion * 1.5);
          }
          const cosB = Math.cos(b.angle);
          const sinB = Math.sin(b.angle);
          const bx = cosB * b.radius * scaleFactor;
          const by = sinB * b.radius * 0.38 * scaleFactor;

          const rotCos = Math.cos(diskTilt);
          const rotSin = Math.sin(diskTilt);
          const posX = centerX + (bx * rotCos - by * rotSin);
          const posY = centerY + (bx * rotSin + by * rotCos);

          const depth = Math.sin(b.angle);
          const depthAlpha = depth > 0 ? 1.0 : 0.4;
          const discAlpha = b.alpha * accretion * depthAlpha;

          ctx.beginPath();
          ctx.arc(posX, posY, b.size * scaleFactor, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${b.color[0]}, ${b.color[1]}, ${b.color[2]}, ${discAlpha})`;
          ctx.fill();
        });

      }

      // =========================================================================
      // 2. PERSISTENT PARTICLE POOL DYNAMICS & SCROLL SCRUBBING
      // =========================================================================
      const sorted = [...particles].sort((a, b) => a.baseZ - b.baseZ);

      sorted.forEach((p, idx) => {
        if (!reduceMotion) {
          p.driftAngle += p.driftSpeed;
        }
        const driftX = Math.cos(p.driftAngle + idx) * 16;
        const driftY = Math.sin(p.driftAngle * 0.8 + idx) * 14;

        let gx = p.baseX + driftX;
        let gy = p.baseY + driftY;

        // Mouse attraction/repulsion interaction
        if (!isMobile) {
          const dxMouse = gx - mouseX;
          const dyMouse = gy - mouseY;
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
          if (distMouse < 160 && distMouse > 1) {
            const force = (1 - distMouse / 160) * 18;
            gx += (dxMouse / distMouse) * force * 0.8;
            gy += (dyMouse / distMouse) * force * 0.8;
          }
        }

        // Multi-layer Concentric Orbit & Accretion Disk Coordinates
        if (!reduceMotion) {
          const speedMultiplier = 1.0 + accretion * 3.8;
          p.orbitAngle += p.orbitSpeed * speedMultiplier;
        }

        const compressedRadius = p.orbitRadius * (1.0 - accretion * 0.42);
        const cosA = Math.cos(p.orbitAngle);
        const sinA = Math.sin(p.orbitAngle);

        const tiltFactor = 0.36 + (1 - accretion) * 0.20;
        const ox = cosA * compressedRadius * scaleFactor;
        const oy = sinA * compressedRadius * tiltFactor * scaleFactor;
        const oz = sinA * compressedRadius * 0.5;

        // Relativistic spiral infall trail during convergence & black hole formation
        const spiralAngleOffset = (1.0 - convergence) * Math.PI * 1.8;
        const rotCos = Math.cos(spiralAngleOffset);
        const rotSin = Math.sin(spiralAngleOffset);
        const spiraledOx = ox * rotCos - oy * rotSin;
        const spiraledOy = ox * rotSin + oy * rotCos;

        const orbitTargetX = centerX + spiraledOx;
        const orbitTargetY = centerY + spiraledOy;

        let curX = gx;
        let curY = gy;
        let curZ = p.baseZ;

        if (p.isAmbientStar) {
          // Ambient stars stay scattered across deep space
          curX = gx + parallaxX;
          curY = gy + parallaxY;
        } else {
          // Particles smoothly curve from galaxy into orbital accretion disk
          curX = gx * (1 - convergence) + orbitTargetX * convergence + parallaxX * (1 - convergence * 0.5);
          curY = gy * (1 - convergence) + orbitTargetY * convergence + parallaxY * (1 - convergence * 0.5);
          curZ = p.baseZ * (1 - convergence) + oz * convergence;
        }

        const scale = Math.max(0.2, focalLength / (focalLength + curZ));
        const screenX = curX;
        const screenY = curY;

        if (screenX < -50 || screenX > width + 50 || screenY < -50 || screenY > height + 50) return;

        // Relativistic Beaming: Approaching side glows intensely
        const depth = Math.sin(p.orbitAngle);
        const relativisticFactor = (accretion > 0.2 && !p.isAmbientStar) ? (depth > 0 ? 1.25 : 0.45) : 1.0;

        const twinkle = reduceMotion ? 1 : 0.8 + 0.2 * Math.sin(time * 3 + idx * 0.7);
        const accretionBoost = p.isAmbientStar ? 0.7 : (1.0 + accretion * 0.6);
        const alpha = Math.min(1, p.baseAlpha * scale * twinkle * accretionBoost * relativisticFactor);

        if (alpha < 0.02) return;

        const [pr, pg, pb] = p.color;
        const projectedSize = Math.max(0.4, p.size * scale * (1.0 + accretion * 0.3));

        const dxHole = screenX - centerX;
        const dyHole = screenY - centerY;
        if (accretion > 0.35 && !p.isAmbientStar && Math.sqrt(dxHole * dxHole + dyHole * dyHole) < eventHorizonRadius) {
          return;
        }

        // Accretion Disk / Foreground Soft Bloom Aura
        if ((p.orbitLayer === 'fg' || accretion > 0.4) && projectedSize > 1.2 && !p.isAmbientStar) {
          ctx.beginPath();
          ctx.arc(screenX, screenY, projectedSize * 3.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${alpha * (0.10 + accretion * 0.12)})`;
          ctx.fill();
        }

        // Core Particle Point
        ctx.beginPath();
        ctx.arc(screenX, screenY, projectedSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${alpha})`;
        ctx.fill();
      });

      // =========================================================================
      // 3. ABSOLUTE OBSIDIAN EVENT HORIZON & FRONT ACTIVE BEACON (Astra Replica)
      // =========================================================================
      if (accretion > 0.04) {
        // Deep Pitch-Black Event Horizon Core Void
        ctx.beginPath();
        ctx.arc(centerX, centerY, eventHorizonRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#010103';
        ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, ${0.95 * accretion})`;
        ctx.shadowBlur = 24;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Razor-Sharp Glowing White Photon Sphere Ring Boundary
        ctx.beginPath();
        ctx.arc(centerX, centerY, eventHorizonRadius + 1.2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.96 * accretion})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Orbiting "ACTIVE" Beacon (Front Side Orbiting Astra Signature)
        const beaconAngle = time * 0.85;
        const beaconRx = 160 * scaleFactor;
        const beaconRy = 54 * scaleFactor;
        const bRawX = Math.cos(beaconAngle) * beaconRx;
        const bRawY = Math.sin(beaconAngle) * beaconRy;

        const bRotCos = Math.cos(diskTilt);
        const bRotSin = Math.sin(diskTilt);
        const beaconX = centerX + (bRawX * bRotCos - bRawY * bRotSin);
        const beaconY = centerY + (bRawX * bRotSin + bRawY * bRotCos);

        // Golden Aura Halo
        const beaconGlow = ctx.createRadialGradient(beaconX, beaconY, 0, beaconX, beaconY, 20);
        beaconGlow.addColorStop(0, `rgba(251, 191, 36, ${0.95 * accretion})`);
        beaconGlow.addColorStop(0.4, `rgba(245, 158, 11, ${0.4 * accretion})`);
        beaconGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = beaconGlow;
        ctx.beginPath();
        ctx.arc(beaconX, beaconY, 20, 0, Math.PI * 2);
        ctx.fill();

        // Solid White Core
        ctx.beginPath();
        ctx.arc(beaconX, beaconY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // "ACTIVE" Monospace Tag above beacon
        if (Math.sin(beaconAngle) > -0.2) {
          ctx.font = '600 9px monospace';
          ctx.fillStyle = `rgba(251, 191, 36, ${accretion})`;
          ctx.textAlign = 'center';
          ctx.fillText('ACTIVE', beaconX, beaconY - 12);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [effects]);

  return (
    <div
      className="cosmic-background-wrapper"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};
