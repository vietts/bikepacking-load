import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import type { Bag, BagType, Bike } from '../../types'
import type { BagStats } from '../../hooks/usePacking'

interface BikeViewerProps {
  bike: Bike | null
  bags: Bag[]
  bagStats: Record<string, BagStats>
  distribution: { front: number; center: number; rear: number }
  highlightBagId?: string | null
  onBagSelect?: (bagType: BagType) => void
  showLabels?: boolean
  caption?: string
}

interface BagFootprint {
  type: BagType
  label: string
  // Path is a closed shape positioned relative to the 440x280 viewBox.
  path: string
  // Anchor for the floating label.
  labelAt: { x: number; y: number; align: 'start' | 'middle' | 'end' }
}

const BAG_FOOTPRINTS: BagFootprint[] = [
  {
    type: 'handlebar',
    label: 'Handlebar',
    // Roll-style bag in front of the bars
    path: 'M262 82 q0 -10 8 -10 h44 q8 0 8 10 v14 q0 8 -8 8 h-44 q-8 0 -8 -8 z',
    labelAt: { x: 292, y: 70, align: 'middle' },
  },
  {
    type: 'top_tube',
    label: 'Top tube',
    // Thin elongated bag riding on the top tube
    path: 'M218 122 q0 -5 5 -5 h44 q5 0 5 5 v6 q0 5 -5 5 h-44 q-5 0 -5 -5 z',
    labelAt: { x: 245, y: 113, align: 'middle' },
  },
  {
    type: 'frame',
    label: 'Frame',
    // Trapezoid that follows the inner triangle (top tube + down tube + seat tube)
    path: 'M211 140 L271 142 L249 188 L215 188 Z',
    labelAt: { x: 240, y: 168, align: 'middle' },
  },
  {
    type: 'saddle',
    label: 'Saddle',
    // Wedge bag extending back from the seat post
    path: 'M196 100 L130 108 L130 124 L196 116 Z',
    labelAt: { x: 152, y: 99, align: 'middle' },
  },
  {
    type: 'fork',
    label: 'Fork',
    // Side-view cylinder on the fork blade
    path: 'M322 168 q0 -4 5 -4 h10 q5 0 5 4 v40 q0 4 -5 4 h-10 q-5 0 -5 -4 z',
    labelAt: { x: 348, y: 192, align: 'start' },
  },
  {
    type: 'rear_rack',
    label: 'Rear rack',
    // Pannier hanging over rear wheel
    path: 'M52 168 q0 -4 5 -4 h70 q5 0 5 4 v32 q0 4 -5 4 h-70 q-5 0 -5 -4 z',
    labelAt: { x: 88, y: 158, align: 'middle' },
  },
]

function getFillColor(stats: BagStats | undefined) {
  if (!stats || (stats.totalWeight === 0 && stats.effectiveVolume === 0)) {
    return { fill: 'oklch(87% 0.022 72 / 0.55)', stroke: 'oklch(60% 0.04 75 / 0.5)' }
  }
  if (stats.overWeight || stats.overVolume) {
    return { fill: 'oklch(48% 0.18 25 / 0.55)', stroke: 'oklch(48% 0.18 25)' }
  }
  const fillPct = Math.max(stats.weightPercent, stats.volumePercent)
  if (fillPct > 88) return { fill: 'oklch(65% 0.14 60 / 0.6)', stroke: 'oklch(55% 0.14 60)' }
  if (fillPct > 60) return { fill: 'oklch(42% 0.12 150 / 0.65)', stroke: 'oklch(35% 0.10 150)' }
  if (fillPct > 25) return { fill: 'oklch(45% 0.11 150 / 0.45)', stroke: 'oklch(38% 0.10 150 / 0.8)' }
  return { fill: 'oklch(50% 0.08 150 / 0.28)', stroke: 'oklch(40% 0.09 150 / 0.5)' }
}

export function BikeViewer({
  bike, bags, bagStats, distribution,
  highlightBagId, onBagSelect, showLabels = true, caption,
}: BikeViewerProps) {
  const bagByType = new Map<BagType, Bag>()
  for (const b of bags) bagByType.set(b.type, b)

  const containerRef = useRef<SVGGElement>(null)
  const prevBagIdsRef = useRef<Set<string>>(new Set())

  // Animate new bags in
  useEffect(() => {
    if (!containerRef.current) return
    const currentIds = new Set(bags.map(b => b.id))
    const newIds = bags.filter(b => !prevBagIdsRef.current.has(b.id)).map(b => b.id)

    newIds.forEach(id => {
      const node = containerRef.current?.querySelector(`[data-bag-id="${id}"]`)
      if (node) {
        gsap.fromTo(node,
          { scale: 0.4, opacity: 0, transformOrigin: 'center center' },
          { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.6)' }
        )
      }
    })

    prevBagIdsRef.current = currentIds
  }, [bags])

  // Heat-map opacity from distribution percentages
  const heatOpacity = (pct: number) => Math.max(0, Math.min(0.28, (pct / 100) * 0.42))

  const isTouring = bike?.type === 'touring'
  const hasSuspension = bike?.type === 'mtb_hardtail' || bike?.type === 'mtb_full'
  const tireStroke = bike?.type === 'gravel' ? 5 : hasSuspension ? 7 : bike?.type === 'touring' ? 5 : 4

  return (
    <div className="card card-border bg-base-100 overflow-hidden">
      <svg
        viewBox="0 0 440 280"
        className="w-full h-auto block"
        role="img"
        aria-label="Your bike with selected bags"
      >
        {/* Weight distribution heat zones */}
        <defs>
          <linearGradient id="zone-rear" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(55% 0.14 60)" stopOpacity={heatOpacity(distribution.rear)} />
            <stop offset="100%" stopColor="oklch(55% 0.14 60)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="zone-center" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(42% 0.12 150)" stopOpacity="0" />
            <stop offset="50%" stopColor="oklch(42% 0.12 150)" stopOpacity={heatOpacity(distribution.center)} />
            <stop offset="100%" stopColor="oklch(42% 0.12 150)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="zone-front" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="oklch(48% 0.10 220)" stopOpacity="0" />
            <stop offset="100%" stopColor="oklch(48% 0.10 220)" stopOpacity={heatOpacity(distribution.front)} />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="180" height="280" fill="url(#zone-rear)" />
        <rect x="155" y="0" width="135" height="280" fill="url(#zone-center)" />
        <rect x="265" y="0" width="175" height="280" fill="url(#zone-front)" />

        {/* Ground line */}
        <line x1="20" y1="250" x2="420" y2="250" stroke="oklch(75% 0.02 75)" strokeWidth="1" strokeDasharray="3 5" opacity="0.6" />

        {/* Bike silhouette */}
        <g stroke="oklch(35% 0.03 50)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Wheels */}
          <circle cx="90" cy="210" r="40" strokeWidth={tireStroke} opacity="0.85" />
          <circle cx="350" cy="210" r="40" strokeWidth={tireStroke} opacity="0.85" />
          <circle cx="90" cy="210" r="3" fill="oklch(35% 0.03 50)" />
          <circle cx="350" cy="210" r="3" fill="oklch(35% 0.03 50)" />

          {/* Spokes - subtle */}
          <g opacity="0.18" strokeWidth="0.8">
            <line x1="90" y1="170" x2="90" y2="250" />
            <line x1="50" y1="210" x2="130" y2="210" />
            <line x1="62" y1="182" x2="118" y2="238" />
            <line x1="62" y1="238" x2="118" y2="182" />
            <line x1="350" y1="170" x2="350" y2="250" />
            <line x1="310" y1="210" x2="390" y2="210" />
            <line x1="322" y1="182" x2="378" y2="238" />
            <line x1="322" y1="238" x2="378" y2="182" />
          </g>

          {/* Frame - main triangle (seat tube + down tube + top tube) */}
          <path d="M204 100 L218 195" strokeWidth="3" /> {/* seat tube */}
          <path d="M218 195 L300 140" strokeWidth="3" /> {/* down tube */}
          <path d="M204 100 L294 138" strokeWidth="3" /> {/* top tube */}

          {/* Rear triangle (chain stays + seat stays) */}
          <path d="M218 195 L90 210" strokeWidth="2.5" /> {/* chain stay */}
          <path d="M204 100 L90 210" strokeWidth="2.5" opacity="0.85" /> {/* seat stay */}

          {/* Head tube */}
          <path d="M294 138 L307 110" strokeWidth="3" />

          {/* Fork */}
          {hasSuspension ? (
            <g>
              <path d="M307 110 L322 170" strokeWidth="6" opacity="0.9" />
              <path d="M322 170 L350 210" strokeWidth="3.5" />
            </g>
          ) : (
            <path d="M307 110 L350 210" strokeWidth="3" />
          )}

          {/* Handlebar */}
          {bike?.type === 'road' && (
            <g>
              <path d="M307 110 L313 88" strokeWidth="2.5" />
              <path d="M313 88 q8 -2 12 4 q3 8 -2 14" strokeWidth="2" />
            </g>
          )}
          {bike?.type === 'gravel' && (
            <g>
              <path d="M307 110 L313 88" strokeWidth="2.5" />
              <path d="M313 88 q12 -2 16 4 q3 8 -4 14" strokeWidth="2" />
            </g>
          )}
          {bike?.type === 'touring' && (
            <g>
              <path d="M307 110 L312 86" strokeWidth="2.5" />
              <path d="M298 86 L334 86" strokeWidth="2.5" />
            </g>
          )}
          {(hasSuspension || !bike) && (
            <g>
              <path d="M307 110 L313 86" strokeWidth="2.5" />
              <path d="M296 86 L338 86" strokeWidth="2.5" />
            </g>
          )}

          {/* Saddle */}
          <path d="M192 96 L216 96" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="204" y1="100" x2="204" y2="96" strokeWidth="2.5" />

          {/* Crankset + pedal hint */}
          <circle cx="218" cy="195" r="6" strokeWidth="1.5" opacity="0.5" />
          <line x1="218" y1="195" x2="232" y2="208" strokeWidth="1.5" opacity="0.6" />

          {/* Rear rack only on touring */}
          {isTouring && (
            <path d="M126 168 L60 168 L60 200" strokeWidth="1.5" opacity="0.45" strokeDasharray="2 2" />
          )}
        </g>

        {/* Bags */}
        <g ref={containerRef}>
          {BAG_FOOTPRINTS.map(fp => {
            const bag = bagByType.get(fp.type)
            const stats = bag ? bagStats[bag.id] : undefined
            const color = getFillColor(stats)
            const isPresent = !!bag
            const isHighlighted = bag?.id === highlightBagId
            const fillPct = stats ? Math.max(stats.weightPercent, stats.volumePercent) : 0
            const isOver = !!(stats && (stats.overWeight || stats.overVolume))

            if (!isPresent) {
              // Empty slot — subtle dashed outline as affordance
              return (
                <g key={fp.type} className="cursor-pointer" onClick={() => onBagSelect?.(fp.type)}>
                  <path
                    d={fp.path}
                    fill="oklch(87% 0.022 72 / 0.15)"
                    stroke="oklch(60% 0.04 75)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.5"
                  />
                  {showLabels && (
                    <text
                      x={fp.labelAt.x}
                      y={fp.labelAt.y}
                      textAnchor={fp.labelAt.align}
                      fontSize="8"
                      fontFamily="var(--font-heading)"
                      fontWeight="700"
                      letterSpacing="0.5"
                      fill="oklch(50% 0.03 60)"
                      opacity="0.55"
                    >
                      + {fp.label.toUpperCase()}
                    </text>
                  )}
                </g>
              )
            }

            return (
              <g
                key={fp.type}
                data-bag-id={bag.id}
                className={onBagSelect ? 'cursor-pointer' : ''}
                onClick={() => onBagSelect?.(fp.type)}
              >
                <path
                  d={fp.path}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  style={{
                    transition: 'fill 0.5s ease, stroke 0.3s ease, stroke-width 0.2s ease',
                    filter: isHighlighted ? 'drop-shadow(0 2px 6px oklch(32% 0.09 150 / 0.4))' : undefined,
                  }}
                />
                {showLabels && (
                  <text
                    x={fp.labelAt.x}
                    y={fp.labelAt.y}
                    textAnchor={fp.labelAt.align}
                    fontSize="8"
                    fontFamily="var(--font-heading)"
                    fontWeight="700"
                    letterSpacing="0.5"
                    fill={isOver ? 'oklch(48% 0.18 25)' : 'oklch(28% 0.04 50)'}
                  >
                    {fp.label.toUpperCase()}
                    {stats && stats.totalWeight > 0 && (
                      <tspan dx="4" fontWeight="500" opacity="0.7">
                        {(stats.totalWeight / 1000).toFixed(1)}kg
                      </tspan>
                    )}
                  </text>
                )}
                {isOver && (
                  <text
                    x={fp.labelAt.x}
                    y={fp.labelAt.y + 10}
                    textAnchor={fp.labelAt.align}
                    fontSize="7"
                    fontFamily="var(--font-heading)"
                    fontWeight="700"
                    fill="oklch(48% 0.18 25)"
                  >
                    {Math.round(fillPct)}%
                  </text>
                )}
              </g>
            )
          })}
        </g>

        {/* Zone labels */}
        {(distribution.front > 0 || distribution.center > 0 || distribution.rear > 0) && (
          <g fontSize="7" fontFamily="var(--font-heading)" fontWeight="700" letterSpacing="0.8" fill="oklch(45% 0.03 60)" opacity="0.55">
            <text x="90" y="268" textAnchor="middle">REAR {Math.round(distribution.rear)}%</text>
            <text x="220" y="268" textAnchor="middle">CENTER {Math.round(distribution.center)}%</text>
            <text x="350" y="268" textAnchor="middle">FRONT {Math.round(distribution.front)}%</text>
          </g>
        )}
      </svg>

      {caption && (
        <div className="px-4 py-2.5 border-t border-base-300 text-small text-base-content/55 text-center">
          {caption}
        </div>
      )}
    </div>
  )
}
