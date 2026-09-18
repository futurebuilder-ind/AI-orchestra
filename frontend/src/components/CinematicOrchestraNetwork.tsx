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
  const gptLabel = modelNames && modelNames[0] ? modelNames[0] : 'gemini-2.5-flash';
  const geminiLabel = modelNames && modelNames[1] ? modelNames[1] : 'gemini-2.5-pro';
  const claudeLabel = modelNames && modelNames[2] ? modelNames[2] : 'gemini-flash-latest';
  const ollamaLabel = modelNames && modelNames[3] ? modelNames[3] : 'gemini-flash-lite-latest';

  // Node positions — responsive layout
  const getNodes = (): NetworkNode[] => {
    if (isMobile) {
      const spacing = height / 6.2;
      return [
        { id: 'user', label: 'User', sublabel: 'PROMPT', x: cx, y: spacing * 0.8, radius: 22, color: '#e4e4e7', glowColor: 'rgba(255,255,255,0.3)', type: 'user' },
        { id: 'core', label: 'AI Orchestra', sublabel: 'CORE ENGINE', x: cx, y: cy, radius: 34, color: '#a855f7', glowColor: 'rgba(168,85,247,0.5)', type: 'core' },
        { id: 'gpt', label: gptLabel, sublabel: 'SOLVER', x: cx - width * 0.28, y: cy + spacing * 1.3, radius: 18, color: '#10b981', glowColor: 'rgba(16,185,129,0.4)', type: 'model' },
        { id: 'gemini', label: geminiLabel, sublabel: 'ANALYST', x: cx, y: cy + spacing * 1.6, radius: 18, color: '#3b82f6', glowColor: 'rgba(59,130,246,0.4)', type: 'model' },
        { id: 'claude', label: claudeLabel, sublabel: 'CRITIC', x: cx + width * 0.28, y: cy + spacing * 1.3, radius: 18, color: '#f59e0b', glowColor: 'rgba(245,158,11,0.4)', type: 'model' },
        { id: 'ollama', label: ollamaLabel, sublabel: 'LOCAL ENGINE', x: cx - width * 0.16, y: cy + spacing * 2.1, radius: 16, color: '#06b6d4', glowColor: 'rgba(6,182,212,0.4)', type: 'model' },
        { id: 'tools', label: 'Tools', sublabel: 'EXECUTOR', x: cx + width * 0.16, y: cy + spacing * 2.1, radius: 16, color: '#ec4899', glowColor: 'rgba(236,72,153,0.4)', type: 'tool' },
      ];
    }

    const modelSpread = Math.min(height * 0.38, 170);
    return [
      { id: 'user', label: 'User', sublabel: 'PROMPT', x: cx - width * 0.35, y: cy, radius: 24, color: '#e4e4e7', glowColor: 'rgba(255,255,255,0.3)', type: 'user' },
      { id: 'core', label: 'AI Orchestra', sublabel: 'CORE ENGINE', x: cx, y: cy, radius: 36, color: '#a855f7', glowColor: 'rgba(168,85,247,0.5)', type: 'core' },
      { id: 'gpt', label: gptLabel, sublabel: 'SOLVER', x: cx + width * 0.3, y: cy - modelSpread * 0.95, radius: 20, color: '#10b981', glowColor: 'rgba(16,185,129,0.4)', type: 'model' },
      { id: 'gemini', label: geminiLabel, sublabel: 'ANALYST', x: cx + width * 0.35, y: cy - modelSpread * 0.3, radius: 20, color: '#3b82f6', glowColor: 'rgba(59,130,246,0.4)', type: 'model' },
      { id: 'claude', label: claudeLabel, sublabel: 'CRITIC', x: cx + width * 0.35, y: cy + modelSpread * 0.3, radius: 20, color: '#f59e0b', glowColor: 'rgba(245,158,11,0.4)', type: 'model' },
      { id: 'ollama', label: ollamaLabel, sublabel: 'LOCAL ENGINE', x: cx + width * 0.3, y: cy + modelSpread * 0.95, radius: 18, color: '#06b6d4', glowColor: 'rgba(6,182,212,0.4)', type: 'model' },
      { id: 'tools', label: 'Tools', sublabel: 'EXECUTOR', x: cx + width * 0.22, y: cy + modelSpread * 1.3, radius: 16, color: '#ec4899', glowColor: 'rgba(236,72,153,0.4)', type: 'tool' },
    ];
  };

  const nodes = getNodes();
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  // Connections
  const connections = [
    { from: 'user', to: 'core' },
    { from: 'core', to: 'gpt' },
    { from: 'core', to: 'gemini' },
    { from: 'core', to: 'claude' },
    { from: 'core', to: 'ollama' },
    { from: 'core', to: 'tools' },
  ];

  // Bezier curve paths
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

  // Animation loop
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
        speed: 0.005 + Math.random() * 0.006,
        color: toNode.color,
        size: 3.5 + Math.random() * 2.5,
        active: true
      });
    };

    let lastSpawn = 0;
    const spawnInterval = 600 + Math.random() * 800;

    const animate = (timestamp: number) => {
      timeRef.current = timestamp;

      if (timestamp - lastSpawn > spawnInterval) {
        spawnPulse();
        lastSpawn = timestamp;
      }

      pulsesRef.current.forEach(p => {
        if (!p.active) return;
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.active = false;
          nodeGlowRef.current[p.toNode] = timestamp;
        }
      });

      pulsesRef.current = pulsesRef.current.filter(p => p.active);

      if (svgRef.current) {
        const pulseGroup = svgRef.current.querySelector('#pulse-group');
        if (pulseGroup) {
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

            const mt = 1 - t;
            const px = mt * mt * mt * from.x + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * to.x;
            const py = mt * mt * mt * from.y + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * to.y;

            const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            glow.setAttribute('cx', px.toString());
            glow.setAttribute('cy', py.toString());
            glow.setAttribute('r', (p.size * 3.2).toString());
            glow.setAttribute('fill', p.color);
            glow.setAttribute('opacity', (0.2 * (1 - t * 0.4)).toString());
            glow.setAttribute('filter', 'url(#pulseBlur)');
            pulseGroup.appendChild(glow);

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', px.toString());
            circle.setAttribute('cy', py.toString());
            circle.setAttribute('r', p.size.toString());
            circle.setAttribute('fill', p.color);
            circle.setAttribute('opacity', (0.95 * (1 - t * 0.2)).toString());
            pulseGroup.appendChild(circle);
          });
        }

        nodes.forEach(node => {
          const glowEl = svgRef.current?.querySelector(`#glow-${node.id}`);
          if (glowEl) {
            const lastHit = nodeGlowRef.current[node.id] || 0;
            const elapsed = timestamp - lastHit;
            const glowOpacity = elapsed < 600 ? 0.7 * (1 - elapsed / 600) : 0;
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
            <feGaussianBlur stdDeviation="20" />
          </filter>
        </defs>

        {/* Connection Paths */}
        {connections.map((conn, idx) => {
          const from = nodeMap[conn.from];
          const to = nodeMap[conn.to];
          if (!from || !to) return null;
          const path = getBezierPath(from, to);

          return (
            <g key={`conn-${idx}`}>
              <path
                d={path}
                fill="none"
                stroke={to.glowColor}
                strokeWidth="2.5"
                opacity="0.18"
                strokeLinecap="round"
              />
              <path
                d={path}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeDasharray="4 6"
              />
            </g>
          );
        })}

        {/* Data Pulse Layer */}
        <g id="pulse-group" />

        {/* Nodes */}
        {nodes.map(node => (
          <g key={node.id}>
            <circle
              id={`glow-${node.id}`}
              cx={node.x}
              cy={node.y}
              r={node.radius * 2.5}
              fill={node.glowColor}
              opacity="0"
              filter="url(#nodeGlow)"
            />

            {node.type === 'core' && (
              <>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius * 2.2}
                  fill="rgba(168,85,247,0.12)"
                  filter="url(#coreGlow)"
                  className="core-ambient-glow"
                />
                <ellipse
                  cx={node.x}
                  cy={node.y}
                  rx={node.radius * 1.6}
                  ry={node.radius * 1.6}
                  fill="none"
                  stroke="rgba(168,85,247,0.25)"
                  strokeWidth="0.8"
                  strokeDasharray="3 5"
                  className="core-orbital-ring"
                />
              </>
            )}

            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={node.type === 'core' ? 'rgba(168,85,247,0.2)' : 'rgba(9, 13, 22, 0.85)'}
              stroke={node.type === 'core' ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.15)'}
              strokeWidth={node.type === 'core' ? 1.5 : 1}
              className="network-node"
            />

            {node.type === 'core' && (
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius * 0.5}
                fill="rgba(168,85,247,0.35)"
                stroke="rgba(168,85,247,0.7)"
                strokeWidth="0.5"
              />
            )}

            {node.type !== 'core' && (
              <circle
                cx={node.x}
                cy={node.y}
                r={4.5}
                fill={node.color}
                opacity="0.9"
              />
            )}

            {node.type === 'core' && (
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#e9d5ff"
                fontSize="16"
                fontWeight="bold"
              >✦</text>
            )}

            {node.type === 'user' && (
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontSize="14"
              >◉</text>
            )}

            <text
              x={node.x}
              y={node.y + node.radius + 14}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={node.type === 'core' ? '11' : '10'}
              fontWeight="600"
              fontFamily="var(--font-mono, 'JetBrains Mono', monospace)"
              letterSpacing="0.04em"
            >
              {node.label}
            </text>

            {node.sublabel && (
              <text
                x={node.x}
                y={node.y + node.radius + 26}
                textAnchor="middle"
                fill="#a1a1aa"
                fontSize="8"
                fontFamily="var(--font-mono, 'JetBrains Mono', monospace)"
                letterSpacing="0.08em"
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

