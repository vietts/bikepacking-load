import { useRef, useEffect } from 'react'
import { useWizard } from '../../hooks/useWizard'
import eventsData from '../../data/events.json'
import type { BikeEvent } from '../../types'
import gsap from 'gsap'

const events = eventsData as BikeEvent[]
const basEvents = events.filter(e => e.isBAS)
const genericEvents = events.filter(e => !e.isBAS)

const eventGradient: Record<string, string> = {
  tge: 'from-blue-900/8 to-blue-700/3',
  tt: 'from-amber-900/8 to-amber-700/3',
  nc4000: 'from-purple-900/8 to-purple-700/3',
  ffp: 'from-red-900/8 to-red-700/3',
  unpaved: 'from-green-900/8 to-green-700/3',
}

const typeBadge: Record<string, string> = {
  road: 'badge-info',
  gravel: 'badge-warning',
  ultra: 'badge-secondary',
  expedition: 'badge-error',
  weekend: 'badge-success',
}

export function Step2Event() {
  const { state, dispatch } = useWizard()
  const basRef = useRef<HTMLDivElement>(null)
  const genRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (basRef.current) {
      gsap.fromTo(basRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }
      )
    }
  }, [])

  function handleSelect(event: BikeEvent) {
    dispatch({ type: 'SET_EVENT', event })
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="label-caps text-primary mb-2">Step 2</p>
        <h2 className="heading-xl text-base-content">Where are you going?</h2>
        <p className="text-body text-base-content/60 mt-3 max-w-lg">
          Pick your event or trip type. This shapes our gear recommendations and weight targets.
        </p>
      </div>

      {/* BAS Events */}
      <div className="space-y-4">
        <p className="label-caps text-base-content/60">BAS Events</p>
        <div ref={basRef} className="grid gap-4">
          {basEvents.map(event => (
            <button
              key={event.id}
              onClick={() => handleSelect(event)}
              aria-pressed={state.event?.id === event.id}
              className={`
                card card-border p-5 text-left transition-all cursor-pointer card-hover
                bg-gradient-to-br ${eventGradient[event.id] ?? 'from-base-100 to-base-100'}
                ${state.event?.id === event.id ? 'card-selected' : 'bg-base-100'}
              `}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="heading-md text-base-content">{event.name}</div>
                  <div className="text-body text-base-content/60 mt-1.5">{event.description}</div>
                  <div className="flex gap-4 mt-3">
                    <span className="text-small text-base-content/60 font-medium">
                      Target: {event.recommendedWeight.min}–{event.recommendedWeight.max} kg
                    </span>
                    <span className="text-small text-base-content/60">
                      Max: {event.maxAcceptableWeight} kg
                    </span>
                  </div>
                </div>
                <span className={`badge badge-sm badge-soft ${typeBadge[event.type] ?? 'badge-ghost'} shrink-0`}>
                  {event.type}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generic Types */}
      <div className="space-y-4">
        <p className="label-caps text-base-content/60">Or choose a trip type</p>
        <div ref={genRef} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {genericEvents.map(event => (
            <button
              key={event.id}
              onClick={() => handleSelect(event)}
              aria-pressed={state.event?.id === event.id}
              className={`
                card card-border p-4 text-left transition-all cursor-pointer card-hover
                ${state.event?.id === event.id ? 'card-selected' : 'bg-base-100'}
              `}
            >
              <div className="heading-md text-base-content text-sm">{event.name}</div>
              <div className="text-small text-base-content/60 mt-1">{event.description}</div>
              <div className="text-small text-base-content/60 mt-2 font-medium">
                {event.recommendedWeight.min}–{event.recommendedWeight.max} kg
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
