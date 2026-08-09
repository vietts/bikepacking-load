import { useRef, useEffect } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { usePacking, type PackingStats } from '../../hooks/usePacking'
import type { UnitSystem } from '../../types'
import { validate } from '../../utils/validation'
import { prefersReducedMotion } from '../../utils/motion'
import { CategoryBreakdown } from '../CategoryBreakdown'
import { formatLoad, formatVolume, loadUnit, loadValue } from '../../utils/units'
import gsap from 'gsap'

/**
 * The four numbers LighterPack taught everyone to look at, rewritten for a bike:
 * what you're wearing never touches the frame, and what you'll eat is gone by tonight.
 * Rows only appear once they're non-zero, so a rider who flags nothing sees nothing.
 */
function WeightBreakdown({ packing, unit }: { packing: PackingStats; unit: UnitSystem }) {
  const rows: { label: string; hint: string; grams: number; strong?: boolean }[] = []

  if (packing.wornWeight > 0) {
    rows.push({ label: 'Everything you bring', hint: 'gear on the bike plus what you wear', grams: packing.totalWeight })
    rows.push({ label: "What you're wearing", hint: 'on you, not on the bike', grams: packing.wornWeight })
  }
  rows.push({ label: 'On the bike', hint: 'the load the frame and bags carry', grams: packing.onBikeWeight, strong: true })
  if (packing.consumableWeight > 0) {
    rows.push({ label: 'Food & water', hint: "you'll be lighter by tonight", grams: packing.consumableWeight })
    rows.push({ label: 'Base weight', hint: 'what you carry every day, empty of supplies', grams: packing.baseWeight })
  }

  if (rows.length <= 1) return null

  return (
    <div className="card card-border bg-base-100 p-6 space-y-3">
      <p className="label-caps text-base-content/60">The numbers, broken down</p>
      <ul className="divide-y divide-base-300/60">
        {rows.map(row => (
          <li key={row.label} className="flex items-baseline justify-between gap-4 py-2">
            <span className="min-w-0">
              <span className={`text-body ${row.strong ? 'font-semibold' : ''}`}>{row.label}</span>
              <span className="block text-small text-base-content/55">{row.hint}</span>
            </span>
            <span className={`tabular-nums shrink-0 ${row.strong ? 'font-bold text-lg' : 'text-base-content/70'}`}>
              {formatLoad(row.grams, unit)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const severityStyle: Record<string, { bg: string; border: string; text: string; icon: string; label: string }> = {
  error:   { bg: 'bg-error/8',   border: 'border-error/20',   text: 'text-error',   icon: '🔴', label: 'Needs fixing' },
  warning: { bg: 'bg-warning/8', border: 'border-warning/20', text: 'text-warning', icon: '⚠️', label: 'Heads up' },
  info:    { bg: 'bg-info/8',    border: 'border-info/20',    text: 'text-info',    icon: '💡', label: 'Tip' },
  success: { bg: 'bg-success/8', border: 'border-success/20', text: 'text-success', icon: '✅', label: 'All good' },
}

export function Step5Results() {
  const { state } = useWizard()
  const packing = usePacking(state)
  const messages = validate(state, packing, state.unit)
  const weightRef = useRef<HTMLSpanElement>(null)
  const barsRef = useRef<HTMLDivElement>(null)
  const msgsRef = useRef<HTMLDivElement>(null)

  // Count-up weight animation (skipped for reduced-motion — show the number now)
  useEffect(() => {
    if (!weightRef.current) return
    const finalValue = loadValue(packing.onBikeWeight, state.unit)
    if (prefersReducedMotion()) {
      weightRef.current.textContent = finalValue
      return
    }
    gsap.fromTo(weightRef.current,
      { innerText: '0.0' },
      {
        innerText: finalValue,
        duration: 0.6,
        ease: 'power2.out',
        snap: { innerText: 0.1 },
        onUpdate() {
          if (weightRef.current) {
            weightRef.current.textContent = parseFloat(weightRef.current.innerText).toFixed(1)
          }
        }
      }
    )
  }, [packing.onBikeWeight, state.unit])

  // Stagger messages (skipped for reduced-motion)
  useEffect(() => {
    if (!msgsRef.current) return
    if (prefersReducedMotion()) {
      gsap.set(msgsRef.current.children, { opacity: 1, y: 0 })
      return
    }
    gsap.fromTo(msgsRef.current.children,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power3.out', delay: 0.15 }
    )
  }, [messages.length])

  const errors = messages.filter(m => m.severity === 'error')
  const warnings = messages.filter(m => m.severity === 'warning')
  const infos = messages.filter(m => m.severity === 'info')
  const successes = messages.filter(m => m.severity === 'success')

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps text-primary mb-2">Step 5</p>
        <h2 className="heading-xl text-base-content">Your load at a glance</h2>
        <p className="text-body text-base-content/60 mt-3 max-w-lg">
          Here's the summary of your setup{state.event ? ` for ${state.event.name}` : ''}.
        </p>
      </div>

      {/* Weight hero */}
      <div className="card card-border bg-base-100 p-8 text-center space-y-5">
        <div>
          <span ref={weightRef} className="text-6xl font-bold font-[var(--font-heading)] tracking-tight">
            {loadValue(packing.onBikeWeight, state.unit)}
          </span>
          <span className="text-2xl text-base-content/60 ml-1">{loadUnit(state.unit)}</span>
          <div className="text-body text-base-content/60 mt-1">
            on the bike
            {packing.wornWeight > 0 && (
              <> · {formatLoad(packing.totalWeight, state.unit)} counting what you're wearing</>
            )}
          </div>
          {state.event && (
            <div className={`text-body font-semibold mt-2 ${
              packing.isOverMaxWeight ? 'text-error' : packing.isInRecommendedRange ? 'text-success' : 'text-warning'
            }`}>
              {packing.isOverMaxWeight
                ? `Over the ${formatLoad(state.event.maxAcceptableWeight * 1000, state.unit)} max`
                : packing.isInRecommendedRange
                  ? `In the sweet spot (${formatLoad(state.event.recommendedWeight.min * 1000, state.unit)}–${formatLoad(state.event.recommendedWeight.max * 1000, state.unit)})`
                  : `Target: ${formatLoad(state.event.recommendedWeight.min * 1000, state.unit)}–${formatLoad(state.event.recommendedWeight.max * 1000, state.unit)}`}
            </div>
          )}
        </div>

        {state.event && (
          <div className="relative">
            <progress
              className={`progress w-full h-4 ${
                packing.isOverMaxWeight ? 'progress-error' : packing.isInRecommendedRange ? 'progress-success' : 'progress-warning'
              }`}
              value={Math.min(100, (packing.onBikeWeightKg / state.event.maxAcceptableWeight) * 100)} max="100"
            />
            <div className="absolute top-0 h-full border-l-2 border-r-2 border-success/30 bg-success/8 rounded"
              style={{
                left: `${(state.event.recommendedWeight.min / state.event.maxAcceptableWeight) * 100}%`,
                width: `${((state.event.recommendedWeight.max - state.event.recommendedWeight.min) / state.event.maxAcceptableWeight) * 100}%`,
              }} />
          </div>
        )}
      </div>

      <WeightBreakdown packing={packing} unit={state.unit} />

      <CategoryBreakdown weights={packing.categoryWeights} unit={state.unit} />

      {/* Per-bag breakdown */}
      <div ref={barsRef} className="card card-border bg-base-100 p-6 space-y-4">
        <p className="label-caps text-base-content/60">Per-bag breakdown</p>
        {state.bags.map(bag => {
          const stats = packing.bagStats[bag.id]
          if (!stats) return null
          const assignedItems = state.selectedItems.filter(i => i.bagId === bag.id && !i.worn)
          return (
            <div key={bag.id} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{bag.type.replace('_', ' ')}{bag.brand && <span className="text-base-content/60 font-normal"> · {bag.brand}</span>}</span>
                <span className="text-base-content/60">
                  {formatLoad(stats.totalWeight, state.unit)} · {formatVolume(stats.effectiveVolume, state.unit)} used
                </span>
              </div>
              <div className="flex gap-2">
                <progress className={`progress flex-1 h-2 ${stats.overWeight ? 'progress-error' : 'progress-success'}`} value={Math.min(100, stats.weightPercent)} max="100" />
                <progress className={`progress flex-1 h-2 ${stats.overVolume ? 'progress-error' : 'progress-info'}`} value={Math.min(100, stats.volumePercent)} max="100" />
              </div>
              <div className="flex flex-wrap gap-1">
                {assignedItems.map(si => (
                  <span key={si.itemId} className="badge badge-ghost badge-xs">
                    {packing.catalog.get(si.itemId)?.name ?? si.itemId}
                    {si.qty > 1 && <span className="opacity-70 ml-1">×{si.qty}</span>}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Weight distribution */}
      <div className="card card-border bg-base-100 p-6 space-y-4">
        <p className="label-caps text-base-content/60">Weight distribution</p>
        <div className="flex gap-6">
          {(['front', 'center', 'rear'] as const).map(zone => (
            <div key={zone} className="flex-1 text-center">
              <div className="text-3xl font-bold font-[var(--font-heading)]">{Math.round(packing.distribution[zone])}%</div>
              <div className="text-small text-base-content/60 capitalize mt-0.5">{zone}</div>
            </div>
          ))}
        </div>
        <div className="h-3 flex rounded-full overflow-hidden bg-base-300">
          <div className="bg-info transition-all duration-700" style={{ width: `${packing.distribution.front}%` }} />
          <div className="bg-success transition-all duration-700" style={{ width: `${packing.distribution.center}%` }} />
          <div className="bg-warning transition-all duration-700" style={{ width: `${packing.distribution.rear}%` }} />
        </div>
      </div>

      {/* Feedback */}
      {messages.length > 0 && (
        <div className="space-y-4">
          <p className="label-caps text-base-content/60">Feedback</p>
          <div ref={msgsRef} className="space-y-3">
            {[...successes, ...errors, ...warnings, ...infos].map((msg, i) => {
              const s = severityStyle[msg.severity]
              return (
                <div key={i} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
                  <div className={`flex items-center gap-2 font-semibold text-sm ${s.text}`}>
                    <span aria-hidden="true">{s.icon}</span>
                    <span className="label-caps text-[10px] opacity-80">{s.label}</span>
                    <span>· {msg.title}</span>
                  </div>
                  <div className={`text-body ${s.text} opacity-90 mt-0.5`}>{msg.message}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
