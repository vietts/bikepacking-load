import { useRef, useEffect } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { usePacking, getItemSpec } from '../../hooks/usePacking'
import { validate } from '../../utils/validation'
import { BikeViewer } from './BikeViewer'
import gsap from 'gsap'

const severityStyle: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  error:   { bg: 'bg-error/8',   border: 'border-error/20',   text: 'text-error',   icon: '🔴' },
  warning: { bg: 'bg-warning/8', border: 'border-warning/20', text: 'text-warning', icon: '⚠️' },
  info:    { bg: 'bg-info/8',    border: 'border-info/20',    text: 'text-info',    icon: '💡' },
  success: { bg: 'bg-success/8', border: 'border-success/20', text: 'text-success', icon: '✅' },
}

export function Step5Results() {
  const { state } = useWizard()
  const packing = usePacking(state)
  const messages = validate(state, packing.bagStats)
  const weightRef = useRef<HTMLSpanElement>(null)
  const barsRef = useRef<HTMLDivElement>(null)
  const msgsRef = useRef<HTMLDivElement>(null)

  // Count-up weight animation
  useEffect(() => {
    if (!weightRef.current) return
    gsap.fromTo(weightRef.current,
      { innerText: '0.0' },
      {
        innerText: packing.totalWeightKg.toFixed(1),
        duration: 1.2,
        ease: 'power2.out',
        snap: { innerText: 0.1 },
        onUpdate() {
          if (weightRef.current) {
            weightRef.current.textContent = parseFloat(weightRef.current.innerText).toFixed(1)
          }
        }
      }
    )
  }, [packing.totalWeightKg])

  // Stagger messages
  useEffect(() => {
    if (!msgsRef.current) return
    gsap.fromTo(msgsRef.current.children,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out', delay: 0.3 }
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

      {/* Bike viewer hero */}
      <div className="max-w-2xl mx-auto">
        <BikeViewer
          bike={state.bike}
          bags={state.bags}
          bagStats={packing.bagStats}
          distribution={packing.distribution}
          caption={state.event
            ? `${state.bike?.type} · ${state.event.name} · ${packing.totalWeightKg.toFixed(1)}kg`
            : `${state.bike?.type} · ${packing.totalWeightKg.toFixed(1)}kg`}
        />
      </div>

      {/* Weight hero */}
      <div className="card card-border bg-base-100 p-8 text-center space-y-5">
        <div>
          <span ref={weightRef} className="text-6xl font-bold font-[var(--font-heading)] tracking-tight">
            {packing.totalWeightKg.toFixed(1)}
          </span>
          <span className="text-2xl text-base-content/40 ml-1">kg</span>
          <div className="text-body text-base-content/45 mt-1">total gear weight</div>
          {state.event && (
            <div className={`text-body font-semibold mt-2 ${
              packing.isOverMaxWeight ? 'text-error' : packing.isInRecommendedRange ? 'text-success' : 'text-warning'
            }`}>
              {packing.isOverMaxWeight
                ? `Over the ${state.event.maxAcceptableWeight}kg max`
                : packing.isInRecommendedRange
                  ? `In the sweet spot (${state.event.recommendedWeight.min}–${state.event.recommendedWeight.max}kg)`
                  : `Target: ${state.event.recommendedWeight.min}–${state.event.recommendedWeight.max}kg`}
            </div>
          )}
        </div>

        {state.event && (
          <div className="relative">
            <progress
              className={`progress w-full h-4 ${
                packing.isOverMaxWeight ? 'progress-error' : packing.isInRecommendedRange ? 'progress-success' : 'progress-warning'
              }`}
              value={Math.min(100, (packing.totalWeightKg / state.event.maxAcceptableWeight) * 100)} max="100"
            />
            <div className="absolute top-0 h-full border-l-2 border-r-2 border-success/30 bg-success/8 rounded"
              style={{
                left: `${(state.event.recommendedWeight.min / state.event.maxAcceptableWeight) * 100}%`,
                width: `${((state.event.recommendedWeight.max - state.event.recommendedWeight.min) / state.event.maxAcceptableWeight) * 100}%`,
              }} />
          </div>
        )}
      </div>

      {/* Per-bag breakdown */}
      <div ref={barsRef} className="card card-border bg-base-100 p-6 space-y-4">
        <p className="label-caps text-base-content/40">Per-bag breakdown</p>
        {state.bags.map(bag => {
          const stats = packing.bagStats[bag.id]
          if (!stats) return null
          const assignedItems = state.selectedItems.filter(i => i.bagId === bag.id)
          return (
            <div key={bag.id} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{bag.type.replace('_', ' ')}{bag.brand && <span className="text-base-content/35 font-normal"> · {bag.brand}</span>}</span>
                <span className="text-base-content/45">
                  {(stats.totalWeight / 1000).toFixed(1)}kg · {stats.effectiveVolume.toFixed(1)}L used
                </span>
              </div>
              <div className="flex gap-2">
                <progress className={`progress flex-1 h-2 ${stats.overWeight ? 'progress-error' : 'progress-success'}`} value={Math.min(100, stats.weightPercent)} max="100" />
                <progress className={`progress flex-1 h-2 ${stats.overVolume ? 'progress-error' : 'progress-info'}`} value={Math.min(100, stats.volumePercent)} max="100" />
              </div>
              <div className="flex flex-wrap gap-1">
                {assignedItems.map(si => (
                  <span key={si.itemId} className="badge badge-ghost badge-xs">{getItemSpec(si.itemId)?.name ?? si.itemId}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Weight distribution */}
      <div className="card card-border bg-base-100 p-6 space-y-4">
        <p className="label-caps text-base-content/40">Weight distribution</p>
        <div className="flex gap-6">
          {(['front', 'center', 'rear'] as const).map(zone => (
            <div key={zone} className="flex-1 text-center">
              <div className="text-3xl font-bold font-[var(--font-heading)]">{Math.round(packing.distribution[zone])}%</div>
              <div className="text-small text-base-content/40 capitalize mt-0.5">{zone}</div>
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
          <p className="label-caps text-base-content/40">Feedback</p>
          <div ref={msgsRef} className="space-y-3">
            {[...successes, ...errors, ...warnings, ...infos].map((msg, i) => {
              const s = severityStyle[msg.severity]
              return (
                <div key={i} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
                  <div className={`font-semibold text-sm ${s.text}`}>{s.icon} {msg.title}</div>
                  <div className={`text-body ${s.text} opacity-75 mt-0.5`}>{msg.message}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
