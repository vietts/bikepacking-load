import { useState } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { usePacking } from '../../hooks/usePacking'
import { getShareUrl } from '../../utils/url-state'
import { toCSV, downloadCSV } from '../../utils/csv'
import { formatItemWeight, formatLoad, formatVolume } from '../../utils/units'
import type { BagPosition, SelectedItem, UnitSystem } from '../../types'

// Order bags front-to-back so the printed list mirrors loading the bike.
const flowRank: Record<BagPosition, number> = {
  front_high: 0, front_low: 1, center_low: 2, top: 3, rear_mid: 4,
}

// Bulkiest first: pack big soft items at the bottom, small dense ones on top.
function byBulk(items: SelectedItem[]): SelectedItem[] {
  return [...items].sort((a, b) => b.volume * b.qty - a.volume * a.qty)
}

function ChecklistRow({ name, qty, grams, unit, note }: { name: string; qty: number; grams: number; unit: UnitSystem; note?: string }) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden="true" className="print-checkbox w-4 h-4 border-2 border-base-content/50 rounded-[4px] shrink-0 mt-1" />
      <span className="flex-1 text-body">
        {name}
        {qty > 1 && <span className="text-base-content/60"> ×{qty}</span>}
        {note && <span className="block text-small text-base-content/60 italic">{note}</span>}
      </span>
      <span className="text-small text-base-content/60 tabular-nums shrink-0">{formatItemWeight(grams * qty, unit)}</span>
    </li>
  )
}

export function Step7Share() {
  const { state, restartKeepingData, reset } = useWizard()
  const packing = usePacking(state)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  const shareUrl = getShareUrl(state)
  const bagsInFlowOrder = [...state.bags].sort(
    (a, b) => (flowRank[a.position] ?? 99) - (flowRank[b.position] ?? 99)
  )
  const wornItems = byBulk(state.selectedItems.filter(i => i.worn))
  const itemCount = state.selectedItems.reduce((sum, i) => sum + i.qty, 0)

  function copyUrl() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopyError(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      // Clipboard permission denied / insecure context — the link is still
      // selectable in the input above, so tell the user rather than staying silent.
      setCopied(false)
      setCopyError(true)
      setTimeout(() => setCopyError(false), 4000)
    })
  }

  function exportCsv() {
    const slug = [state.bike?.type, state.event?.name ?? 'trip']
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
    downloadCSV(`${slug}-packing-list.csv`, toCSV(state, packing.catalog))
  }

  return (
    <div className="space-y-8">
      <div className="print:hidden">
        <p className="label-caps text-primary mb-2">Step 7</p>
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
          <p className="text-sm">
            <span className="capitalize">{state.bike?.type}</span> {state.bike?.size}{state.event && ` · ${state.event.name}`} · {formatLoad(packing.onBikeWeight, state.unit)} on the bike
          </p>
        </div>

        {/* Setup summary (screen) */}
        <div className="text-center print:hidden">
          <div className="text-small text-base-content/60 capitalize">
            {state.bike?.model ? state.bike.model : state.bike?.type} {state.bike?.size}{state.event && <> · {state.event.name}</>}
          </div>
          <div className="text-5xl font-bold font-[var(--font-heading)] tracking-tight mt-1">
            {formatLoad(packing.onBikeWeight, state.unit)}
          </div>
          <div className="text-small text-base-content/60 mt-1">
            on the bike · {state.bags.length} {state.bags.length === 1 ? 'bag' : 'bags'} · {itemCount} items
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
                    {formatLoad(stats?.totalWeight ?? 0, state.unit)} · {formatVolume(bag.volume, state.unit)}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {assignedItems.map(si => (
                    <ChecklistRow key={si.itemId} name={packing.catalog.get(si.itemId)?.name ?? si.itemId} qty={si.qty} grams={si.weight} unit={state.unit} note={si.note} />
                  ))}
                </ul>
              </div>
            )
          })}

          {/* Gear on its own mounts — bottles, GPS, lights. On the bike, not in a bag. */}
          {(() => {
            const mounted = byBulk(state.selectedItems.filter(i => packing.catalog.get(i.itemId)?.category === 'mounted'))
            if (mounted.length === 0) return null
            const mountedWeight = mounted.reduce((s, i) => s + i.weight * i.qty, 0)
            return (
              <div className="break-inside-avoid">
                <div className="flex justify-between items-baseline border-b border-base-300 pb-1.5 mb-2.5">
                  <h3 className="heading-md text-sm">Mounted on the bike</h3>
                  <span className="text-small text-base-content/60 shrink-0">
                    {formatLoad(mountedWeight, state.unit)} · on its own attachments
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {mounted.map(si => (
                    <ChecklistRow key={si.itemId} name={packing.catalog.get(si.itemId)?.name ?? si.itemId} qty={si.qty} grams={si.weight} unit={state.unit} note={si.note} />
                  ))}
                </ul>
              </div>
            )
          })()}

          {(() => {
            const unassigned = byBulk(state.selectedItems.filter(i =>
              !i.bagId && !i.worn && packing.catalog.get(i.itemId)?.category !== 'mounted'
            ))
            if (unassigned.length === 0) return null
            return (
              <div className="break-inside-avoid">
                <div className="flex justify-between items-baseline border-b border-base-300 pb-1.5 mb-2.5">
                  <h3 className="heading-md text-sm">Not assigned yet</h3>
                  <span className="text-small text-base-content/60 shrink-0">
                    {formatLoad(packing.unassignedWeight, state.unit)}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {unassigned.map(si => (
                    <ChecklistRow key={si.itemId} name={packing.catalog.get(si.itemId)?.name ?? si.itemId} qty={si.qty} grams={si.weight} unit={state.unit} note={si.note} />
                  ))}
                </ul>
              </div>
            )
          })()}

          {/* Worn gear gets its own block: it goes on you at the door, not into a bag. */}
          {wornItems.length > 0 && (
            <div className="break-inside-avoid">
              <div className="flex justify-between items-baseline border-b border-base-300 pb-1.5 mb-2.5">
                <h3 className="heading-md text-sm">Wearing it</h3>
                <span className="text-small text-base-content/60 shrink-0">
                  {formatLoad(packing.wornWeight, state.unit)} · not on the bike
                </span>
              </div>
              <ul className="space-y-1.5">
                {wornItems.map(si => (
                  <ChecklistRow key={si.itemId} name={packing.catalog.get(si.itemId)?.name ?? si.itemId} qty={si.qty} grams={si.weight} unit={state.unit} note={si.note} />
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Shopping list — items flagged "to buy" in the gear step, plus blank
            lines for whatever comes to mind with the printout in hand */}
        {(() => {
          const toBuyItems = byBulk(state.selectedItems.filter(i => i.toBuy))
          const blankLines = toBuyItems.length > 0 ? 3 : 5
          return (
            <div className="break-inside-avoid">
              <div className="flex items-baseline justify-between border-b border-base-300 pb-1.5 mb-3">
                <h3 className="heading-md text-sm">To buy</h3>
                <span className="text-small text-base-content/60 shrink-0">gear still to pick up</span>
              </div>
              {toBuyItems.length > 0 && (
                <ul className="space-y-1.5 mb-4">
                  {toBuyItems.map(si => (
                    <ChecklistRow key={si.itemId} name={packing.catalog.get(si.itemId)?.name ?? si.itemId} qty={si.qty} grams={si.weight} unit={state.unit} note={si.note} />
                  ))}
                </ul>
              )}
              <div className="space-y-5">
                {Array.from({ length: blankLines }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span aria-hidden="true" className="print-checkbox w-4 h-4 border-2 border-base-content/50 rounded-[4px] shrink-0" />
                    <span className="flex-1 border-b border-base-content/30" />
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Actions — extra breathing room between the checklist card and the share tools */}
      <div className="space-y-3 pt-4 print:hidden">
        <div className="join w-full">
          <input type="text" readOnly value={shareUrl}
            className="input input-bordered join-item flex-1 text-small text-base-content/60 truncate" />
          <button onClick={copyUrl} className="btn btn-primary join-item">
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
        </div>
        {copyError && (
          <p role="alert" className="text-small text-error">
            Couldn't copy automatically — select the link above and copy it manually.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => window.print()} className="btn flex-1 border border-base-300">
            🖨 Print / save as PDF checklist
          </button>
          <button onClick={exportCsv} className="btn flex-1 border border-base-300">
            ⭳ Download as CSV
          </button>
        </div>
        <p className="text-small text-base-content/50 text-center">
          The CSV opens in any spreadsheet — and LighterPack reads it too.
        </p>

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
              onClick={() => { if (window.confirm('Wipe everything and start from scratch?')) reset() }}
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
