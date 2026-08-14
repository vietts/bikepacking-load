import { useState } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { usePacking, getItemSpec } from '../../hooks/usePacking'
import { getShareUrl } from '../../utils/url-state'

export function Step7Share() {
  const { state, restartKeepingData, resetAll } = useWizard()
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
        <p className="label-caps text-primary mb-2">Step 7</p>
        <h2 className="heading-xl text-base-content">Share your setup</h2>
        <p className="text-body text-base-content/60 mt-3 max-w-lg">
          Show this to your riding buddies!
        </p>
      </div>

      {/* Summary card */}
      <div className="card card-border bg-base-100 p-6 space-y-4 print:border-0">
        <div className="text-center">
          <div className="text-small text-base-content/40">
            {state.bike?.model ? state.bike.model : state.bike?.type} {state.bike?.size}{state.event && <> · {state.event.name}</>}
          </div>
          <div className="text-5xl font-bold font-[var(--font-heading)] tracking-tight mt-1">
            {packing.totalWeightKg.toFixed(1)} kg
          </div>
          <div className="text-small text-base-content/40 mt-1">
            {state.bags.length} bags · {state.selectedItems.length} items
          </div>
        </div>

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

        {/* Start again — everything stays saved */}
        <div className="card card-border bg-base-100 p-5 space-y-3">
          <p className="label-caps text-base-content/40">Not done tweaking?</p>
          <p className="text-small text-base-content/50">
            Run through the wizard again — your bike, bags and gear list are all saved, so you only change what you want.
          </p>
          <div className="flex gap-3">
            <button onClick={restartKeepingData} className="btn btn-primary btn-sm flex-1">
              ↻ Start over (keep my setup)
            </button>
            <button
              onClick={() => { if (window.confirm('Wipe everything and start from scratch?')) resetAll() }}
              className="btn btn-ghost btn-sm border border-base-300">
              Start from scratch
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="card bg-gradient-to-br from-primary/10 to-accent/5 border-2 border-primary/15 p-8 text-center space-y-4">
          <div className="heading-lg">Ready to ride?</div>
          <p className="text-body text-base-content/60 max-w-md mx-auto">
            Join thousands of bikepackers at the next Bike Adventure Series event.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="https://bikeadventureseries.com" target="_blank" rel="noopener noreferrer"
              className="btn btn-primary">Explore events</a>
            <a href="https://bikeadventureseries.com/newsletter" target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost border border-primary/20">Get the newsletter</a>
          </div>
        </div>
      </div>
    </div>
  )
}
