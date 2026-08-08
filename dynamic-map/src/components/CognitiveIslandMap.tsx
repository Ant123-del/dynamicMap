import type { Pitstop } from '../types/cognitiveHub'
import { formatClock } from '../utils/format'
import { getPitstopStatus } from '../utils/pitstopStatus'

interface CognitiveIslandMapProps {
  pitstops: Pitstop[]
  activePitstopIndex: number
}

const ISLAND_SAND =
  'M 50 8 C 68 8 88 18 92 38 C 96 58 90 78 72 90 C 56 100 40 100 24 90 C 8 80 4 60 8 40 C 12 20 32 8 50 8 Z'
const ISLAND_GRASS =
  'M 50 16 C 64 16 80 24 83 40 C 86 56 82 72 68 82 C 54 90 42 90 30 82 C 18 74 15 58 18 42 C 21 26 36 16 50 16 Z'

const TREES = [
  { x: 26, y: 34 },
  { x: 30, y: 62 },
  { x: 66, y: 30 },
  { x: 72, y: 58 },
  { x: 46, y: 70 },
]

const ROCKS = [
  { x: 40, y: 28 },
  { x: 60, y: 66 },
  { x: 34, y: 50 },
]

function Tree({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={0.5}>
      <rect x={-0.3} y={0} width={0.6} height={1.6} fill="#6b4a2f" />
      <circle cx={0} cy={-0.8} r={1.6} fill="#2f6d4f" />
    </g>
  )
}

function Rock({ x, y }: { x: number; y: number }) {
  return <ellipse cx={x} cy={y} rx={1.4} ry={0.9} fill="#5b6472" opacity={0.4} />
}

const NODE_FILL: Record<string, string> = {
  past: '#64748b',
  active: '#2dd4bf',
  next: '#f472b6',
  future: '#818cf8',
}

function nodeGlyph(pitstop: Pitstop): string {
  if (pitstop.kind === 'stranding') return '!'
  if (pitstop.kind === 'start') return 'S'
  if (pitstop.kind === 'end') return 'E'
  return String(pitstop.level)
}

export function CognitiveIslandMap({ pitstops, activePitstopIndex }: CognitiveIslandMapProps) {
  return (
    <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-sky-950 to-slate-950 p-2 shadow-xl shadow-black/20">
      <svg viewBox="0 0 100 100" className="h-auto w-full" role="img" aria-label="Cognitive island map">
        <path d={ISLAND_SAND} fill="#d8c08a" opacity={0.9} />
        <path d={ISLAND_GRASS} fill="#3a6b4a" opacity={0.85} />

        {ROCKS.map((r, i) => (
          <Rock key={`rock-${i}`} {...r} />
        ))}
        {TREES.map((t, i) => (
          <Tree key={`tree-${i}`} {...t} />
        ))}

        {pitstops.map((pitstop, index) => {
          const status = getPitstopStatus(index, pitstop.kind, activePitstopIndex)
          const { x, y } = pitstop.mapCoordinates

          if (status === 'deviation') {
            return (
              <g key={pitstop.id} transform={`translate(${x} ${y})`}>
                <title>{`${pitstop.label} · ${formatClock(pitstop.scheduledTime)}`}</title>
                <rect
                  x={-2.4}
                  y={-2.4}
                  width={4.8}
                  height={4.8}
                  fill="#f59e0b"
                  stroke="#78350f"
                  strokeWidth={0.3}
                  transform="rotate(45)"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={2.6}
                  fontWeight={700}
                  fill="#1c1917"
                >
                  {nodeGlyph(pitstop)}
                </text>
              </g>
            )
          }

          return (
            <g key={pitstop.id}>
              <title>{`${pitstop.label} · ${formatClock(pitstop.scheduledTime)}${status === 'next' ? ' (next stop)' : ''}`}</title>
              {status === 'active' && (
                <circle cx={x} cy={y} r={3.2} fill="#2dd4bf" opacity={0.5} className="animate-ping" />
              )}
              {status === 'next' && (
                <circle
                  cx={x}
                  cy={y}
                  r={3.6}
                  fill="none"
                  stroke="#f472b6"
                  strokeWidth={0.4}
                  strokeDasharray="1.2 1"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={2.6}
                fill={NODE_FILL[status]}
                opacity={status === 'past' ? 0.55 : 1}
                stroke={status === 'active' ? '#f0fdfa' : status === 'next' ? '#fdf2f8' : 'none'}
                strokeWidth={status === 'active' || status === 'next' ? 0.4 : 0}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={2.4}
                fontWeight={600}
                fill={status === 'past' ? '#e2e8f0' : '#0f172a'}
              >
                {status === 'past' ? '✓' : nodeGlyph(pitstop)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
