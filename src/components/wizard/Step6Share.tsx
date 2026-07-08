import { useState } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { usePacking, getItemSpec } from '../../hooks/usePacking'
import { getShareUrl } from '../../utils/url-state'
import type { BagPosition, SelectedItem } from '../../types'

// Order bags front-to-back so the printed list mirrors loading the bike.
const flowRank: Record<BagPosition, number> = {
  front_high: 0, front_low: 1, center_low: 2, top: 3, rear_mid: 4,
}

// Bulkiest first: pack big soft items at the bottom, small dense ones on top.
function byBulk(items: SelectedItem[]): SelectedItem[] {
  return [...items].sort((a, b) => b.volume - a.volume)
}

function ChecklistRow({ name, grams }: { name: string; grams: number }) {
  return (
    <li className="flex items-center gap-3">
      <span aria-hidden="true" className="print-checkbox w-4 h-4 border-2 border-base-content/50 rounded-[4px] shrink-0" />
      <span className="flex-1 text-body">{name}</span>
      <span className="text-small text-base-content/60 tabular-nums shrink-0">{grams}g</span>
    </li>
  )
}

export function Step6Share() {
  const { state } = useWizard()
  const packing = usePacking(state)
  const [copied, setCopied] = useState(false)

  const shareUrl = getShareUrl(state)
  const bagsInFlowOrder = [...state.bags].sort(
    (a, b) => (flowRank[a.position] ?? 99) - (flowRank[b.position] ?? 99)
  )

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
          Copy the link below and send it to your riding buddies — it opens this exact setup. Your setup is also saved on this device, so you can come back anytime.
        </p>
      </div>

      {/* Packing checklist — grouped by bag, bulkiest first, tick boxes to print */}
      <div className="card card-border bg-base-100 p-6 space-y-5 print:border-0 print:shadow-none print:p-0">
        {/* Print-only document header */}
        <div className="hidden print:block border-b-2 border-base-content pb-2 mb-2">
          <h1 className="text-2xl font-bold">Packing list</h1>
          <p className="text-sm capitalize">
            {state.bike?.type} {state.bike?.size}{state.event && ` · ${state.event.name}`} · {packing.totalWeightKg.toFixed(1)} kg total
          </p>
        </div>

        {/* Setup summary (screen) */}
        <div className="text-center print:hidden">
          <div className="text-small text-base-content/60 capitalize">
            {state.bike?.type} {state.bike?.size}{state.event && <> · {state.event.name}</>}
          </div>
          <div className="text-5xl font-bold font-[var(--font-heading)] tracking-tight mt-1">
            {packing.totalWeightKg.toFixed(1)} kg
          </div>
          <div className="text-small text-base-content/60 mt-1">
            {state.bags.length} {state.bags.length === 1 ? 'bag' : 'bags'} · {state.selectedItems.length} items total
          </div>
        </div>

        <p className="text-small text-base-content/60 print:text-xs">
          Listed bulkiest first — pack the big, soft items at the bottom of each bag and the small, dense things on top. Tick each box as you pack.
        </p>

        <div className="space-y-6">
          {bagsInFlowOrder.map(bag => {
            const assignedItems = byBulk(state.selectedItems.filter(i => i.bagId === bag.id))
            if (assignedItems.length === 0) return null
            const stats = packing.bagStats[bag.id]
            return (
              <div key={bag.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline border-b border-base-300 pb-1.5 mb-2.5">
                  <h3 className="heading-md text-sm capitalize">
                    {bag.type.replace('_', ' ')}
                    {bag.brand && <span className="font-normal text-base-content/60"> · {bag.brand}</span>}
                  </h3>
                  <span className="text-small text-base-content/60 shrink-0">
                    {stats ? (stats.totalWeight / 1000).toFixed(1) : '0.0'}kg · {bag.volume}L
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {assignedItems.map(si => (
                    <ChecklistRow key={si.itemId} name={getItemSpec(si.itemId)?.name ?? si.itemId} grams={si.weight} />
                  ))}
                </ul>
              </div>
            )
          })}

          {(() => {
            const unassigned = byBulk(state.selectedItems.filter(i => !i.bagId))
            if (unassigned.length === 0) return null
            return (
              <div className="break-inside-avoid">
                <div className="flex justify-between items-baseline border-b border-base-300 pb-1.5 mb-2.5">
                  <h3 className="heading-md text-sm">Not assigned yet</h3>
                  <span className="text-small text-base-content/60 shrink-0">
                    {(packing.unassignedWeight / 1000).toFixed(1)}kg
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {unassigned.map(si => (
                    <ChecklistRow key={si.itemId} name={getItemSpec(si.itemId)?.name ?? si.itemId} grams={si.weight} />
                  ))}
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
            className="input input-bordered join-item flex-1 text-small text-base-content/60 truncate" />
          <button onClick={copyUrl} className="btn btn-primary join-item">
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
        </div>

        <button onClick={() => window.print()} className="btn btn-block border border-base-300">
          🖨 Print / save as PDF checklist
        </button>

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
