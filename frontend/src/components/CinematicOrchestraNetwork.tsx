import React, { useEffect, useRef, useState } from 'react';

interface NetworkNode {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  glowColor: string;
  type: 'user' | 'core' | 'model' | 'tool';
}

interface DataPulse {
  id: number;
  fromNode: string;
  toNode: string;
  progress: number;
  speed: number;
  color: string;
  size: number;
  active: boolean;
}

interface CinematicOrchestraNetworkProps {
  modelNames?: string[];
}

export const CinematicOrchestraNetwork: React.FC<CinematicOrchestraNetworkProps> = ({ modelNames }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 500 });
  const [isMobile, setIsMobile] = useState(false);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const pulsesRef = useRef<DataPulse[]>([]);
  const pulseIdRef = useRef(0);
  const nodeGlowRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const mobile = w < 768;
        setIsMobile(mobile);
        setDimensions({
          width: w,
          height: mobile ? Math.min(w * 1.15, 540) : Math.min(w * 0.52, 520)
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const { width, height } = dimensions;
  const cx = width / 2;
  const cy = height / 2;

  // Model names fallback or dynamic override
  const gptLabel = modelNames && modelNames[0] ? modelNames[0] : 'GPT-4o';
  const geminiLabel = modelNames && modelNames[1] ? modelNames[1] : 'Gemini';
  const claudeLabel = modelNames && modelNames[2] ? modelNames[2] : 'Claude';
  const ollamaLabel = modelNames && modelNames[3] ? modelNames[3] : 'Ollama';

  // Node positions — responsive
  const getNodes = (): NetworkNode[] => {
    if (isMobile) {
      const spacing = height / 6.2;
      return [
        { id: 'user', label: 'User', sublabel: 'PROMPT', x: cx, y: spacing * 0.8, radius: 22, color: '#a1a1aa', glowColor: 'rgba(161,161,170,0.3)', type: 'user' },
        { id: 'core', label: 'AI Orchestra', sublabel: 'CORE ENGINE', x: cx, y: cy, radius: 34, color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.45)', type: 'core' },
        { id: 'gpt', label: gptLabel, sublabel: 'SOLVER', x: cx - width * 0.28, y: cy + spacing * 1.3, radius: 18, color: '#10b981', glowColor: 'rgba(16,185,129,0.3)', type: 'model' },
        { id: 'gemini', label: geminiLabel, sublabel: 'ANALYST', x: cx, y: cy + spacing * 1.6, radius: 18, color: '#3b82f6', glowColor: 'rgba(59,130,246,0.3)', type: 'model' },
        { id: 'claude', label: claudeLabel, sublabel: 'CRITIC', x: cx + width * 0.28, y: cy + spacing * 1.3, radius: 18, color: '#f59e0b', glowColor: 'rgba(245,158,11,0.3)', type: 'model' },
        { id: 'ollama', label: ollamaLabel, sublabel: 'LOCAL ENGINE', x: cx - width * 0.16, y: cy + spacing * 2.1, radius: 16, color: '#06b6d4', glowColor: 'rgba(6,182,212,0.3)', type: 'model' },
        { id: 'tools', label: 'Tools', sublabel: 'EXECUTOR', x: cx + width * 0.16, y: cy + spacing * 2.1, radius: 16, color: '#ec4899', glowColor: 'rgba(236,72,153,0.3)', type: 'tool' },
      ];
    }

    const modelSpread = Math.min(height * 0.38, 170);
    return [
      { id: 'user', label: 'User', sublabel: 'PROMPT', x: cx - width * 0.35, y: cy, radius: 24, color: '#a1a1aa', glowColor: 'rgba(161,161,170,0.3)', type: 'user' },
      { id: 'core', label: 'AI Orchestra', sublabel: 'CORE ENGINE', x: cx, y: cy, radius: 36, color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.45)', type: 'core' },
      { id: 'gpt', label: gptLabel, sublabel: 'SOLVER', x: cx + width * 0.3, y: cy - modelSpread * 0.95, radius: 20, color: '#10b981', glowColor: 'rgba(16,185,129,0.3)', type: 'model' },
      { id: 'gemini', label: geminiLabel, sublabel: 'ANALYST', x: cx + width * 0.35, y: cy - modelSpread * 0.3, radius: 20, color: '#3b82f6', glowColor: 'rgba(59,130,246,0.3)', type: 'model' },
      { id: 'claude', label: claudeLabel, sublabel: 'CRITIC', x: cx + width * 0.35, y: cy + modelSpread * 0.3, radius: 20, color: '#f59e0b', glowColor: 'rgba(245,158,11,0.3)', type: 'model' },
      { id: 'ollama', label: ollamaLabel, sublabel: 'LOCAL ENGINE', x: cx + width * 0.3, y: cy + modelSpread * 0.95, radius: 18, color: '#06b6d4', glowColor: 'rgba(6,182,212,0.3)', type: 'model' },
      { id: 'tools', label: 'Tools', sublabel: 'EXECUTOR', x: cx + width * 0.22, y: cy + modelSpread * 1.3, radius: 16, color: '#ec4899', glowColor: 'rgba(236,72,153,0.3)', type: 'tool' },
    ];
  };

  const nodes = getNodes();
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  // Connection paths
  const connections = [
    { from: 'user', to: 'core' },
    { from: 'core', to: 'gpt' },
    { from: 'core', to: 'gemini' },
    { from: 'core', to: 'claude' },
    { from: 'core', to: 'ollama' },
    { from: 'core', to: 'tools' },
  ];

  // Generate Bezier path between two nodes
  const getBezierPath = (from: NetworkNode, to: NetworkNode): string => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = dist * 0.25;

    if (isMobile) {
      const c1x = from.x + dx * 0.15;
      const c1y = from.y + dy * 0.5 - curvature * 0.3;
      const c2x = to.x - dx * 0.15;
      const c2y = to.y - dy * 0.5 + curvature * 0.3;
      return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
    }

    const c1x = from.x + dx * 0.4;
    const c1y = from.y + dy * 0.1;
    const c2x = to.x - dx * 0.4;
    const c2y = to.y - dy * 0.1;
    return `M ${from.x} ${from.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${to.x} ${to.y}`;
  };

  // Animation loop for data pulses
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const spawnPulse = () => {
      const connIdx = Math.floor(Math.random() * connections.length);
      const conn = connections[connIdx];
      const fromNode = nodeMap[conn.from];
      const toNode = nodeMap[conn.to];
      if (!fromNode || !toNode) return;

      pulseIdRef.current++;
      pulsesRef.current.push({
        id: pulseIdRef.current,
        fromNode: conn.from,
        toNode: conn.to,
        progress: 0,
        speed: 0.003 + Math.random() * 0.004,
        color: toNode.color,
        size: 3 + Math.random() * 2,
        active: true
      });
    };

    let lastSpawn = 0;
    const spawnInterval = 800 + Math.random() * 1200;

    const animate = (timestamp: number) => {
      timeRef.current = timestamp;

      // Spawn new pulses
      if (timestamp - lastSpawn > spawnInterval) {
        spawnPulse();
        lastSpawn = timestamp;
      }

      // Update pulses
      pulsesRef.current.forEach(p => {
        if (!p.active) return;
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.active = false;
          // Trigger node glow
          nodeGlowRef.current[p.toNode] = timestamp;
        }
      });

      // Clean up dead pulses
      pulsesRef.current = pulsesRef.current.filter(p => p.active);

      // Force SVG re-render via state would be expensive, instead manipulate DOM directly
      if (svgRef.current) {
        const pulseGroup = svgRef.current.querySelector('#pulse-group');
        if (pulseGroup) {
          // Clear existing
          while (pulseGroup.firstChild) pulseGroup.removeChild(pulseGroup.firstChild);

          pulsesRef.current.forEach(p => {
            const from = nodeMap[p.fromNode];
            const to = nodeMap[p.toNode];
            if (!from || !to) return;

            const t = p.progress;
            const dx = to.x - from.x;
            const dy = to.y - from.y;

            let c1x: number, c1y: number, c2x: number, c2y: number;
            if (isMobile) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              const curvature = dist * 0.25;
              c1x = from.x + dx * 0.15;
              c1y = from.y + dy * 0.5 - curvature * 0.3;
              c2x = to.x - dx * 0.15;
              c2y = to.y - dy * 0.5 + curvature * 0.3;
            } else {
              c1x = from.x + dx * 0.4;
              c1y = from.y + dy * 0.1;
              c2x = to.x - dx * 0.4;
              c2y = to.y - dy * 0.1;
            }

            // Cubic Bezier point
            const mt = 1 - t;
            const px = mt * mt * mt * from.x + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * to.x;
            const py = mt * mt * mt * from.y + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * to.y;

            // Glow circle
            const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            glow.setAttribute('cx', px.toString());
            glow.setAttribute('cy', py.toString());
            glow.setAttribute('r', (p.size * 3).toString());
            glow.setAttribute('fill', p.color);
            glow.setAttribute('opacity', (0.15 * (1 - t * 0.5)).toString());
            glow.setAttribute('filter', 'url(#pulseBlur)');
            pulseGroup.appendChild(glow);

            // Core circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', px.toString());
            circle.setAttribute('cy', py.toString());
            circle.setAttribute('r', p.size.toString());
            circle.setAttribute('fill', p.color);
            circle.setAttribute('opacity', (0.9 * (1 - t * 0.3)).toString());
            pulseGroup.appendChild(circle);
          });
        }

        // Update node glows
        nodes.forEach(node => {
          const glowEl = svgRef.current?.querySelector(`#glow-${node.id}`);
          if (glowEl) {
            const lastHit = nodeGlowRef.current[node.id] || 0;
            const elapsed = timestamp - lastHit;
            const glowOpacity = elapsed < 600 ? 0.6 * (1 - elapsed / 600) : 0;
            (glowEl as SVGElement).setAttribute('opacity', glowOpacity.toString());
          }
        });
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [dimensions, isMobile]);

  return (
    <div ref={containerRef} className="cinematic-network-container">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="pulseBlur">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="coreGlow">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          {/* Subtle grain texture */}
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>
        </defs>

        {/* Connection paths */}
        {connections.map((conn, idx) => {
          const from = nodeMap[conn.from];
          const to = nodeMap[conn.to];
          if (!from || !to) return null;
          const path = getBezierPath(from, to);

          return (
            <g key={`conn-${idx}`}>
              {/* Ambient glow line */}
              <path
                d={path}
                fill="none"
                stroke={to.glowColor}
                strokeWidth="3"
                opacity="0.12"
                strokeLinecap="round"
              />
              {/* Base line */}
              <path
                d={path}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeDasharray="4 6"
              />
            </g>
          );
        })}

        {/* Data pulse layer */}
        <g id="pulse-group" />

        {/* Nodes */}
        {nodes.map(node => (
          <g key={node.id}>
            {/* Node hit glow (animated via JS) */}
            <circle
              id={`glow-${node.id}`}
              cx={node.x}
              cy={node.y}
              r={node.radius * 2.5}
              fill={node.glowColor}
              opacity="0"
              filter="url(#nodeGlow)"
            />

            {/* Core ambient glow */}
            {node.type === 'core' && (
              <>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius * 2.2}
                  fill="rgba(139,92,246,0.08)"
                  filter="url(#coreGlow)"
                  className="core-ambient-glow"
                />
                {/* Orbital ring */}
                <ellipse
                  cx={node.x}
                  cy={node.y}
                  rx={node.radius * 1.6}
                  ry={node.radius * 1.6}
                  fill="none"
                  stroke="rgba(139,92,246,0.15)"
                  strokeWidth="0.8"
                  strokeDasharray="3 5"
                  className="core-orbital-ring"
                />
              </>
            )}

            {/* Node circle */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={node.type === 'core' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)'}
              stroke={node.type === 'core' ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.12)'}
              strokeWidth={node.type === 'core' ? 1.5 : 1}
              className="network-node"
            />

            {/* Inner icon circle for core */}
            {node.type === 'core' && (
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius * 0.5}
                fill="rgba(139,92,246,0.3)"
                stroke="rgba(139,92,246,0.6)"
                strokeWidth="0.5"
              />
            )}

            {/* Model color dot */}
            {node.type !== 'core' && (
              <circle
                cx={node.x}
                cy={node.y}
                r={4}
                fill={node.color}
                opacity="0.8"
              />
            )}

            {/* Core icon: ✦ */}
            {node.type === 'core' && (
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#c4b5fd"
                fontSize="16"
                fontWeight="bold"
              >✦</text>
            )}

            {/* User icon: ○ */}
            {node.type === 'user' && (
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#a1a1aa"
                fontSize="14"
              >◉</text>
            )}

            {/* Label */}
            <text
              x={node.x}
              y={node.y + node.radius + 14}
              textAnchor="middle"
              fill="#f5f5f5"
              fontSize={node.type === 'core' ? '11' : '10'}
              fontWeight={node.type === 'core' ? '600' : '500'}
              fontFamily="'Geist', 'Inter', sans-serif"
              letterSpacing="0.03em"
            >
              {node.label}
            </text>

            {/* Sublabel */}
            {node.sublabel && (
              <text
                x={node.x}
                y={node.y + node.radius + 26}
                textAnchor="middle"
                fill="#71717a"
                fontSize="8"
                fontFamily="'JetBrains Mono', monospace"
                letterSpacing="0.06em"
              >
                {node.sublabel.toUpperCase()}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};
