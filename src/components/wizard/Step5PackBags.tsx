import { useState, useRef, useEffect } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { usePacking, fitsGirth } from '../../hooks/usePacking'
import type { ItemSpec, BagType, Bag, ItemCategory } from '../../types'
import { bagIcons } from '../../assets/icons/BagIcons'
import { itemCategoryIcons } from '../../assets/icons/ItemCategoryIcons'
import { formatLoad, formatVolume, formatItemWeight } from '../../utils/units'
import gsap from 'gsap'

type Flight = { key: number; category: ItemCategory; start: { x: number; y: number }; end: { x: number; y: number } }

const bagLabels: Record<BagType, string> = {
  handlebar: 'Handlebar',
  frame: 'Frame',
  saddle: 'Saddle',
  top_tube: 'Top Tube',
  fork: 'Fork Cages',
  rear_rack: 'Rear Rack',
}

const bagHints: Record<BagType, string> = {
  handlebar: 'Light and bulky rides best up front — sleeping gear, soft clothes.',
  frame: 'The strongest spot on the bike. Heavy stuff goes here: tools, food, water.',
  saddle: 'Clothes and things you only need at camp. Keep it under ~5kg or it sways.',
  top_tube: 'Your glove box — snacks, phone, lip balm. Stuff you grab while riding.',
  fork: 'Low and stable. Water bottles and heavy compact items.',
  rear_rack: 'Big capacity for touring setups. Balance left and right.',
}

export function Step5PackBags() {
  const { state, dispatch } = useWizard()
  const packing = usePacking(state)
  const [bagIndex, setBagIndex] = useState(0)
  const focusRef = useRef<HTMLDivElement>(null)
  const autoAssigned = useRef(false)
  const bagTargetRef = useRef<HTMLSpanElement>(null)
  const flightRef = useRef<HTMLDivElement>(null)
  const [flight, setFlight] = useState<Flight | null>(null)

  const bags = state.bags
  const bag: Bag | undefined = bags[Math.min(bagIndex, bags.length - 1)]
  const catalog = packing.catalog

  // Pre-populate: on entry, drop every unplaced item into its preferred bag (when that bag exists).
  useEffect(() => {
    if (autoAssigned.current || bags.length === 0) return
    autoAssigned.current = true
    const assignments: { itemId: string; bagId: string }[] = []
    for (const si of state.selectedItems) {
      if (si.bagId || si.worn) continue
      const spec = catalog.get(si.itemId)
      const target = spec?.preferredBag ? bags.find(b => b.type === spec.preferredBag) : undefined
      if (target && fitsGirth(si.itemId, target, catalog)) assignments.push({ itemId: si.itemId, bagId: target.id })
    }
    if (assignments.length > 0) dispatch({ type: 'ASSIGN_MANY', assignments })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Animate when switching bag
  useEffect(() => {
    if (!focusRef.current) return
    gsap.fromTo(focusRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
    )
  }, [bagIndex])

  // Fly the item icon from where it was clicked into the focused bag
  useEffect(() => {
    if (!flight || !flightRef.current) return
    gsap.fromTo(flightRef.current,
      { left: flight.start.x, top: flight.start.y, opacity: 1, scale: 1 },
      {
        left: flight.end.x, top: flight.end.y, opacity: 0, scale: 0.3,
        duration: 0.45, ease: 'power2.in',
        onComplete: () => {
          setFlight(null)
          if (bagTargetRef.current) {
            gsap.fromTo(bagTargetRef.current, { scale: 1 }, { scale: 1.15, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 })
          }
        },
      }
    )
  }, [flight])

  if (!bag) {
    return (
      <div className="space-y-6">
        <div>
          <p className="label-caps text-primary mb-2">Step 5</p>
          <h2 className="heading-xl text-base-content">Pack bag by bag</h2>
          <p className="text-body text-base-content/60 mt-3 max-w-lg">
            You haven't picked any bags yet — go back to step 3 and add at least one.
          </p>
        </div>
      </div>
    )
  }

  const stats = packing.bagStats[bag.id]
  const inBag = state.selectedItems.filter(i => i.bagId === bag.id)
  const unplaced = state.selectedItems.filter(i => !i.bagId && !i.worn)
  const suggestedHere = unplaced.filter(si => catalog.get(si.itemId)?.preferredBag === bag.type)
  const otherUnplaced = unplaced.filter(si => catalog.get(si.itemId)?.preferredBag !== bag.type)

  const selectedIds = new Set(state.selectedItems.map(i => i.itemId))
  const catalogSuggestions = [...catalog.values()].filter(i =>
    !selectedIds.has(i.id) &&
    i.preferredBag === bag.type &&
    !(state.event?.unnecessaryItems.includes(i.id)) &&
    fitsGirth(i.id, bag, catalog)
  )

  const isOverloaded = stats && (stats.overWeight || stats.overVolume)
  const isNearLimit = stats && !isOverloaded && (stats.weightPercent > 80 || stats.volumePercent > 90)
  const isLastBag = bagIndex === bags.length - 1

  function triggerFlight(sourceEl: HTMLElement, category: ItemCategory) {
    if (!bagTargetRef.current) return
    const s = sourceEl.getBoundingClientRect()
    const t = bagTargetRef.current.getBoundingClientRect()
    setFlight({
      key: Date.now(),
      category,
      start: { x: s.left + s.width / 2 - 10, y: s.top + s.height / 2 - 10 },
      end: { x: t.left + t.width / 2 - 10, y: t.top + t.height / 2 - 10 },
    })
  }

  function addToBag(itemId: string, e: React.MouseEvent<HTMLButtonElement>) {
    if (!fitsGirth(itemId, bag!, catalog)) return
    const spec = catalog.get(itemId)
    if (spec) triggerFlight(e.currentTarget, spec.category)
    dispatch({ type: 'ASSIGN_ITEM', itemId, bagId: bag!.id })
  }

  function moveItem(itemId: string, bagId: string | null) {
    dispatch({ type: 'ASSIGN_ITEM', itemId, bagId })
  }

  function quickAddFromCatalog(item: ItemSpec, e: React.MouseEvent<HTMLButtonElement>) {
    triggerFlight(e.currentTarget, item.category)
    const avgWeight = Math.round((item.weight.min + item.weight.max) / 2)
    const avgVolume = +((item.volume.min + item.volume.max) / 2).toFixed(2)
    dispatch({ type: 'TOGGLE_ITEM', itemId: item.id, weight: avgWeight, volume: avgVolume })
    dispatch({ type: 'ASSIGN_ITEM', itemId: item.id, bagId: bag!.id })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps text-primary mb-2">Step 5</p>
        <h2 className="heading-xl text-base-content">Pack bag by bag</h2>
        <p className="text-body text-base-content/60 mt-3 max-w-lg">
          One bag at a time. We've pre-placed your gear where it usually rides best — adjust as you like.
        </p>
      </div>

      {/* Bag selector strip — inventory slots */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {bags.map((b, i) => {
          const bStats = packing.bagStats[b.id]
          const count = state.selectedItems.filter(si => si.bagId === b.id).length
          const Icon = bagIcons[b.type]
          const isCurrent = i === bagIndex
          const troubled = bStats && (bStats.overWeight || bStats.overVolume)
          return (
            <button key={b.id} onClick={() => setBagIndex(i)}
              className={`card shrink-0 px-4 py-3 flex flex-col items-center gap-1 min-w-24 cursor-pointer transition-all ${
                isCurrent ? 'card-selected' : troubled ? 'border-2 border-error/40 bg-error/5' : 'card-border bg-base-100 card-hover'
              }`}>
              <Icon className={isCurrent ? 'text-primary' : 'text-base-content/40'} />
              <span className={`text-[11px] font-semibold ${isCurrent ? 'text-primary' : 'text-base-content/50'}`}>
                {bagLabels[b.type]}
              </span>
              <span className={`badge badge-xs ${troubled ? 'badge-error' : count > 0 ? 'badge-primary badge-soft' : 'badge-ghost'}`}>
                {count} item{count === 1 ? '' : 's'}
              </span>
            </button>
          )
        })}
      </div>

      <div ref={focusRef} className="space-y-4">
        {/* Flying item ghost */}
        {flight && (() => {
          const FlightIcon = itemCategoryIcons[flight.category]
          return (
            <div ref={flightRef} className="fixed z-50 pointer-events-none text-primary drop-shadow"
              style={{ left: flight.start.x, top: flight.start.y }}>
              <FlightIcon size={20} />
            </div>
          )
        })()}

        {/* What still needs a home + ideas — above the focused bag */}
        {unplaced.length > 0 && (
          <div className="card card-border bg-base-100 p-4 space-y-3">
            <p className="label-caps text-base-content/40">
              Still to place <span className="badge badge-warning badge-xs align-middle">{unplaced.length}</span>
            </p>

            {suggestedHere.length > 0 && (
              <div className="space-y-1.5">
                {suggestedHere.map(si => {
                  const spec = catalog.get(si.itemId)
                  const Icon = spec ? itemCategoryIcons[spec.category] : null
                  const blocked = !fitsGirth(si.itemId, bag, catalog)
                  return (
                    <div key={si.itemId} className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                      blocked ? 'bg-error/5 border-error/20' : 'bg-success/8 border-success/20'
                    }`}>
                      {Icon && <Icon size={18} className={`${blocked ? 'text-error/60' : 'text-success/70'} shrink-0`} />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{spec?.name ?? si.itemId}</div>
                        {blocked ? (
                          <div className="text-[10px] text-error font-semibold">TOO WIDE FOR THIS BAG'S OPENING</div>
                        ) : (
                          <div className="text-[10px] text-success font-semibold">FITS THIS BAG</div>
                        )}
                      </div>
                      {blocked ? (
                        <button disabled className="btn btn-xs btn-ghost text-error/60 border border-error/20">Won't fit</button>
                      ) : (
                        <button onClick={e => addToBag(si.itemId, e)} className="btn btn-success btn-xs">+ Add</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {otherUnplaced.length > 0 && (
              <div className="space-y-1.5">
                {otherUnplaced.map(si => {
                  const spec = catalog.get(si.itemId)
                  const Icon = spec ? itemCategoryIcons[spec.category] : null
                  const prefLabel = spec?.preferredBag ? bagLabels[spec.preferredBag] : null
                  const blocked = !fitsGirth(si.itemId, bag, catalog)
                  return (
                    <div key={si.itemId} className="flex items-center gap-2 bg-base-200/40 rounded-lg px-3 py-2">
                      {Icon && <Icon size={18} className="text-base-content/40 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{spec?.name ?? si.itemId}</div>
                        {blocked ? (
                          <div className="text-[10px] text-error/70">too wide for this bag's opening</div>
                        ) : prefLabel ? (
                          <div className="text-[10px] text-base-content/35">usually goes in {prefLabel}</div>
                        ) : null}
                      </div>
                      {blocked ? (
                        <button disabled className="btn btn-ghost btn-xs border border-base-300 opacity-50">Won't fit</button>
                      ) : (
                        <button onClick={e => addToBag(si.itemId, e)} className="btn btn-ghost btn-xs border border-base-300">+ Add</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {unplaced.length === 0 && (
          <div className="card border-2 border-success/30 bg-success/5 p-4">
            <p className="text-small text-success font-medium">✓ Everything has a home. Check each bag, then continue.</p>
          </div>
        )}

        {catalogSuggestions.length > 0 && (
          <div className="card card-border bg-base-100 p-4 space-y-2">
            <p className="label-caps text-base-content/40">Ideas for this bag</p>
            <p className="text-[11px] text-base-content/35 -mt-1">Not on your list yet — tap to add.</p>
            <div className="flex flex-wrap gap-1.5">
              {catalogSuggestions.map(item => {
                const Icon = itemCategoryIcons[item.category]
                return (
                  <button key={item.id} onClick={e => quickAddFromCatalog(item, e)}
                    className="badge badge-outline badge-lg cursor-pointer hover:badge-primary transition-colors gap-1.5">
                    <Icon size={14} />
                    {item.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Focused bag */}
        <div className="space-y-4">
          <div className={`card p-5 space-y-4 border-2 ${
            isOverloaded ? 'border-error bg-error/5' : isNearLimit ? 'border-warning bg-warning/5' : 'card-border bg-base-100'
          }`}>
            <div className="flex items-center gap-3">
              <span ref={bagTargetRef} className="shrink-0">
                {(() => { const Icon = bagIcons[bag.type]; return <Icon className="text-base-content/60" /> })()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="heading-md">
                  {bagLabels[bag.type]}
                  {bag.brand && <span className="text-base-content/35 font-normal"> · {bag.brand}{bag.model ? ` ${bag.model}` : ''}</span>}
                </div>
                <div className="text-small text-base-content/40">{bag.volume}L · max {bag.maxWeight}kg</div>
              </div>
              <span className="text-small text-base-content/35 font-medium">Bag {bagIndex + 1} of {bags.length}</span>
            </div>

            <p className="text-small text-base-content/50 italic">{bagHints[bag.type]}</p>

            {stats && (
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className={stats.overWeight ? 'text-error font-bold' : 'text-base-content/35'}>
                      Weight {stats.overWeight && '— over limit!'}
                    </span>
                    <span className={stats.overWeight ? 'text-error font-bold' : 'text-base-content/35'}>
                      {formatLoad(stats.totalWeight, state.unit)} / {formatLoad(bag.maxWeight * 1000, state.unit)}
                    </span>
                  </div>
                  <progress className={`progress w-full h-2 ${stats.overWeight ? 'progress-error' : stats.weightPercent > 80 ? 'progress-warning' : 'progress-success'}`}
                    value={Math.min(100, stats.weightPercent)} max="100" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className={stats.overVolume ? 'text-error font-bold' : 'text-base-content/35'}>
                      Space used {stats.overVolume && "— won't fit!"}
                    </span>
                    <span className={stats.overVolume ? 'text-error font-bold' : 'text-base-content/35'}>
                      {formatVolume(stats.effectiveVolume, state.unit)} / {formatVolume(bag.volume, state.unit)}
                    </span>
                  </div>
                  <progress className={`progress w-full h-2 ${stats.overVolume ? 'progress-error' : stats.volumePercent > 90 ? 'progress-warning' : 'progress-info'}`}
                    value={Math.min(100, stats.volumePercent)} max="100" />
                </div>
              </div>
            )}

            {isOverloaded && stats && (
              <div className="bg-error/10 rounded-lg px-3 py-2 text-small text-error">
                {stats.overWeight && stats.overVolume
                  ? `Too heavy and too full. Move ${formatLoad(stats.totalWeight - bag.maxWeight * 1000, state.unit)} and ${formatVolume(stats.effectiveVolume - bag.volume, state.unit)} worth of items to another bag.`
                  : stats.overWeight
                    ? `${formatLoad(stats.totalWeight - bag.maxWeight * 1000, state.unit)} over the limit. Move heavy items to ${bag.type === 'handlebar' ? 'the frame bag' : 'another bag'}.`
                    : `These items take up ${formatVolume(stats.effectiveVolume, state.unit)} but the bag only fits ${formatVolume(bag.volume, state.unit)}. Try swapping for softer gear or move something out.`}
              </div>
            )}

            {/* Items in this bag */}
            <div className="space-y-1.5">
              <p className="label-caps text-base-content/40">In this bag</p>
              {inBag.length === 0 ? (
                <p className="text-small text-base-content/25 italic">Empty — add something from below.</p>
              ) : inBag.map(si => {
                const spec = catalog.get(si.itemId)
                const Icon = spec ? itemCategoryIcons[spec.category] : null
                return (
                  <div key={si.itemId} className="flex items-center gap-2 bg-base-200/40 rounded-lg px-3 py-2">
                    {Icon && <Icon size={16} className="text-base-content/40 shrink-0" />}
                    <span className="text-sm font-medium flex-1 min-w-0 truncate">
                      {spec?.name ?? si.itemId}
                      {si.qty > 1 && <span className="text-base-content/40 font-normal"> ×{si.qty}</span>}
                    </span>
                    <span className="text-small text-base-content/35 shrink-0">{formatItemWeight(si.weight * si.qty, state.unit)}</span>
                    <select value={bag.id} onChange={e => moveItem(si.itemId, e.target.value || null)}
                      className="select select-xs select-bordered shrink-0 w-32"
                      aria-label={`Move ${spec?.name ?? si.itemId}`}>
                      {bags.map(b => {
                        const canFit = b.id === bag.id || fitsGirth(si.itemId, b, catalog)
                        return (
                          <option key={b.id} value={b.id} disabled={!canFit}>
                            {b.id === bag.id ? '✓ ' : '→ '}{bagLabels[b.type]}{!canFit ? " — won't fit" : ''}
                          </option>
                        )
                      })}
                      <option value="">Set aside</option>
                    </select>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bag-to-bag navigation */}
          <div className="flex justify-between items-center">
            <button onClick={() => setBagIndex(i => Math.max(0, i - 1))}
              disabled={bagIndex === 0}
              className="btn btn-ghost btn-sm gap-1 disabled:opacity-0">
              ← {bagIndex > 0 ? bagLabels[bags[bagIndex - 1].type] : ''}
            </button>
            {!isLastBag ? (
              <button onClick={() => setBagIndex(i => Math.min(bags.length - 1, i + 1))}
                className="btn btn-primary btn-sm gap-1">
                Next bag: {bagLabels[bags[bagIndex + 1].type]} →
              </button>
            ) : (
              <span className="text-small text-base-content/40">
                Last bag — hit <span className="font-semibold">Review list</span> below to check your load.
              </span>
            )}
          </div>
        </div>

        {/* Total so far */}
        <div className={`card p-4 text-center font-semibold border-2 ${
          packing.isOverMaxWeight ? 'border-error bg-error/8 text-error'
          : packing.isInRecommendedRange ? 'border-success bg-success/8 text-success'
          : 'border-warning bg-warning/8 text-warning'
        }`}>
          {formatLoad(packing.onBikeWeight, state.unit)}
          {state.event && (
            <span className="font-normal text-small"> / {state.event.recommendedWeight.min}–{state.event.recommendedWeight.max} kg target</span>
          )}
        </div>
      </div>
    </div>
  )
}
