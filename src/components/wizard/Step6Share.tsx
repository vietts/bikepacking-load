import { useState } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { usePacking, getItemSpec } from '../../hooks/usePacking'
import { getShareUrl } from '../../utils/url-state'
import { BikeViewer } from './BikeViewer'

export function Step6Share() {
  const { state } = useWizard()
  const packing = usePacking(state)
  const [copied, setCopied] = useState(false)

  const shareUrl = getShareUrl(state)

  function copyUrl() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps text-primary mb-2">Step 6</p>
        <h2 className="heading-xl text-base-content">Share your setup</h2>
        <p className="text-body text-base-content/60 mt-3 max-w-lg">
          Show this to your riding buddies!
        </p>
      </div>

      {/* Summary card */}
      <div className="card card-border bg-base-100 p-6 space-y-4 print:border-0">
        <div className="text-center">
          <div className="text-small text-base-content/40">
            {state.bike?.type} {state.bike?.size}{state.event && <> · {state.event.name}</>}
          </div>
          <div className="text-5xl font-bold font-[var(--font-heading)] tracking-tight mt-1">
            {packing.totalWeightKg.toFixed(1)} kg
          </div>
          <div className="text-small text-base-content/40 mt-1">
            {state.bags.length} bags · {state.selectedItems.length} items
          </div>
        </div>

        <BikeViewer
          bike={state.bike}
          bags={state.bags}
          bagStats={packing.bagStats}
          distribution={packing.distribution}
        />

        <div className="divider my-1" />

        <div className="space-y-4">
          {state.bags.map(bag => {
            const assignedItems = state.selectedItems.filter(i => i.bagId === bag.id)
            if (assignedItems.length === 0) return null
            return (
              <div key={bag.id}>
                <p className="label-caps text-base-content/40 mb-1">
                  {bag.type.replace('_', ' ')} {bag.brand && `(${bag.brand})`}
                </p>
                <ul className="space-y-0.5">
                  {assignedItems.map(si => {
                    const spec = getItemSpec(si.itemId)
                    return (
                      <li key={si.itemId} className="text-body flex justify-between">
                        <span>{spec?.name ?? si.itemId}</span>
                        <span className="text-base-content/30">{si.weight}g</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}

          {(() => {
            const unassigned = state.selectedItems.filter(i => !i.bagId)
            if (unassigned.length === 0) return null
            return (
              <div>
                <p className="label-caps text-base-content/40 mb-1">Not assigned</p>
                <ul className="space-y-0.5">
                  {unassigned.map(si => {
                    const spec = getItemSpec(si.itemId)
                    return (
                      <li key={si.itemId} className="text-body flex justify-between">
                        <span>{spec?.name ?? si.itemId}</span>
                        <span className="text-base-content/30">{si.weight}g</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 print:hidden">
        <div className="join w-full">
          <input type="text" readOnly value={shareUrl}
            className="input input-bordered join-item flex-1 text-small text-base-content/40 truncate" />
          <button onClick={copyUrl} className="btn btn-primary join-item">
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
        </div>

        <button onClick={() => window.print()} className="btn btn-ghost btn-block border border-base-300">
          Print packing list
        </button>

        {/* CTA — contextual to chosen event */}
        <EventCTA />
      </div>
    </div>
  )
}

const BAS_EVENT_URLS: Record<string, string> = {
  tge: 'https://bikeadventureseries.com/the-grand-escape',
  tt: 'https://bikeadventureseries.com/tuscany-trail',
  nc4000: 'https://bikeadventureseries.com/northcape4000',
  ffp: 'https://bikeadventureseries.com/final-frontier-patagonia',
  unpaved: 'https://bikeadventureseries.com/unpaved-roads',
}

function EventCTA() {
  const { state } = useWizard()
  const event = state.event
  const isBAS = event?.isBAS === true
  const eventUrl = event && BAS_EVENT_URLS[event.id]

  if (isBAS && event && eventUrl) {
    const tip = event.tips?.[0]
    return (
      <div className="card bg-gradient-to-br from-primary/12 to-accent/6 border-2 border-primary/20 p-8 text-center space-y-4">
        <div>
          <p className="label-caps text-accent">You're ready for</p>
          <div className="heading-lg mt-1">{event.name}</div>
        </div>
        {tip && (
          <p className="text-body text-base-content/65 max-w-md mx-auto italic">
            “{tip}”
          </p>
        )}
        <p className="text-body text-base-content/60 max-w-md mx-auto">
          Your setup matches what works for this ride. The hardest part is done — now grab a spot.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a href={eventUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Sign up for {event.name}
          </a>
          <a href="https://bikeadventureseries.com/newsletter" target="_blank" rel="noopener noreferrer"
            className="btn btn-ghost border border-primary/20">
            Get the newsletter
          </a>
        </div>
      </div>
    )
  }

  // Non-BAS event or no event selected
  return (
    <div className="card bg-gradient-to-br from-primary/10 to-accent/5 border-2 border-primary/15 p-8 text-center space-y-4">
      <div className="heading-lg">Ready for the real thing?</div>
      <p className="text-body text-base-content/60 max-w-md mx-auto">
        Your setup is sorted. Now find a ride that matches it — BAS runs no-race bikepacking events all over Europe and Patagonia for riders just like you.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <a href="https://bikeadventureseries.com" target="_blank" rel="noopener noreferrer"
          className="btn btn-primary">Explore events</a>
        <a href="https://bikeadventureseries.com/newsletter" target="_blank" rel="noopener noreferrer"
          className="btn btn-ghost border border-primary/20">Get the newsletter</a>
      </div>
    </div>
  )
}
