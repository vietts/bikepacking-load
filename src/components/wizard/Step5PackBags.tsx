import { useState, useRef, useEffect } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { usePacking, getItemSpec } from '../../hooks/usePacking'
import itemsData from '../../data/items.json'
import type { ItemSpec, BagType, Bag } from '../../types'
import { bagIcons } from '../../assets/icons/BagIcons'
import gsap from 'gsap'

const items = itemsData as ItemSpec[]

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

  const bags = state.bags
  const bag: Bag | undefined = bags[Math.min(bagIndex, bags.length - 1)]

  // Pre-populate: on entry, drop every unplaced item into its preferred bag (when that bag exists).
  useEffect(() => {
    if (autoAssigned.current || bags.length === 0) return
    autoAssigned.current = true
    const assignments: { itemId: string; bagId: string }[] = []
    for (const si of state.selectedItems) {
      if (si.bagId) continue
      const spec = getItemSpec(si.itemId)
      const target = spec?.preferredBag ? bags.find(b => b.type === spec.preferredBag) : undefined
      if (target) assignments.push({ itemId: si.itemId, bagId: target.id })
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
  const unplaced = state.selectedItems.filter(i => !i.bagId)
  const suggestedHere = unplaced.filter(si => getItemSpec(si.itemId)?.preferredBag === bag.type)
  const otherUnplaced = unplaced.filter(si => getItemSpec(si.itemId)?.preferredBag !== bag.type)

  const selectedIds = new Set(state.selectedItems.map(i => i.itemId))
  const catalogSuggestions = items.filter(i =>
    !selectedIds.has(i.id) &&
    i.preferredBag === bag.type &&
    !(state.event?.unnecessaryItems.includes(i.id))
  )

  const isOverloaded = stats && (stats.overWeight || stats.overVolume)
  const isNearLimit = stats && !isOverloaded && (stats.weightPercent > 80 || stats.volumePercent > 90)
  const isLastBag = bagIndex === bags.length - 1

  function addToBag(itemId: string) {
    dispatch({ type: 'ASSIGN_ITEM', itemId, bagId: bag!.id })
  }

  function moveItem(itemId: string, bagId: string | null) {
    dispatch({ type: 'ASSIGN_ITEM', itemId, bagId })
  }

  function quickAddFromCatalog(item: ItemSpec) {
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

      <div ref={focusRef} className="lg:flex lg:gap-8 lg:items-start">
        {/* Focused bag */}
        <div className="flex-1 space-y-4">
          <div className={`card p-5 space-y-4 border-2 ${
            isOverloaded ? 'border-error bg-error/5' : isNearLimit ? 'border-warning bg-warning/5' : 'card-border bg-base-100'
          }`}>
            <div className="flex items-center gap-3">
              {(() => { const Icon = bagIcons[bag.type]; return <Icon className="text-base-content/60" /> })()}
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
                      {(stats.totalWeight / 1000).toFixed(1)} / {bag.maxWeight}kg
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
                      {stats.effectiveVolume.toFixed(1)}L / {bag.volume}L
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
                  ? `Too heavy and too full. Move ${((stats.totalWeight / 1000) - bag.maxWeight).toFixed(1)}kg and ${(stats.effectiveVolume - bag.volume).toFixed(1)}L worth of items to another bag.`
                  : stats.overWeight
                    ? `${((stats.totalWeight / 1000) - bag.maxWeight).toFixed(1)}kg over the limit. Move heavy items to ${bag.type === 'handlebar' ? 'the frame bag' : 'another bag'}.`
                    : `These items take up ${stats.effectiveVolume.toFixed(1)}L but the bag only fits ${bag.volume}L. Try swapping for softer gear or move something out.`}
              </div>
            )}

            {/* Items in this bag */}
            <div className="space-y-1.5">
              <p className="label-caps text-base-content/40">In this bag</p>
              {inBag.length === 0 ? (
                <p className="text-small text-base-content/25 italic">Empty — add something from below.</p>
              ) : inBag.map(si => {
                const spec = getItemSpec(si.itemId)
                return (
                  <div key={si.itemId} className="flex items-center gap-2 bg-base-200/40 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium flex-1 min-w-0 truncate">{spec?.name ?? si.itemId}</span>
                    <span className="text-small text-base-content/35 shrink-0">{si.weight}g</span>
                    <select value={bag.id} onChange={e => moveItem(si.itemId, e.target.value || null)}
                      className="select select-xs select-bordered shrink-0 w-32"
                      aria-label={`Move ${spec?.name ?? si.itemId}`}>
                      {bags.map(b => (
                        <option key={b.id} value={b.id}>{b.id === bag.id ? '✓ ' : '→ '}{bagLabels[b.type]}</option>
                      ))}
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
                Last bag — hit <span className="font-semibold">Continue</span> below to review your load.
              </span>
            )}
          </div>
        </div>

        {/* Right rail: what still needs a home + ideas */}
        <div className="lg:w-80 mt-8 lg:mt-0 space-y-4">
          {unplaced.length > 0 && (
            <div className="card card-border bg-base-100 p-4 space-y-3">
              <p className="label-caps text-base-content/40">
                Still to place <span className="badge badge-warning badge-xs align-middle">{unplaced.length}</span>
              </p>

              {suggestedHere.length > 0 && (
                <div className="space-y-1.5">
                  {suggestedHere.map(si => {
                    const spec = getItemSpec(si.itemId)
                    return (
                      <div key={si.itemId} className="flex items-center gap-2 bg-success/8 border border-success/20 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{spec?.name ?? si.itemId}</div>
                          <div className="text-[10px] text-success font-semibold">FITS THIS BAG</div>
                        </div>
                        <button onClick={() => addToBag(si.itemId)} className="btn btn-success btn-xs">+ Add</button>
                      </div>
                    )
                  })}
                </div>
              )}

              {otherUnplaced.length > 0 && (
                <div className="space-y-1.5">
                  {otherUnplaced.map(si => {
                    const spec = getItemSpec(si.itemId)
                    const prefLabel = spec?.preferredBag ? bagLabels[spec.preferredBag] : null
                    return (
                      <div key={si.itemId} className="flex items-center gap-2 bg-base-200/40 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{spec?.name ?? si.itemId}</div>
                          {prefLabel && <div className="text-[10px] text-base-content/35">usually goes in {prefLabel}</div>}
                        </div>
                        <button onClick={() => addToBag(si.itemId)} className="btn btn-ghost btn-xs border border-base-300">+ Add</button>
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
                {catalogSuggestions.map(item => (
                  <button key={item.id} onClick={() => quickAddFromCatalog(item)}
                    className="badge badge-outline badge-lg cursor-pointer hover:badge-primary transition-colors">
                    + {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Total so far */}
          <div className={`card p-4 text-center font-semibold border-2 ${
            packing.isOverMaxWeight ? 'border-error bg-error/8 text-error'
            : packing.isInRecommendedRange ? 'border-success bg-success/8 text-success'
            : 'border-warning bg-warning/8 text-warning'
          }`}>
            {packing.totalWeightKg.toFixed(1)} kg
            {state.event && (
              <span className="font-normal text-small"> / {state.event.recommendedWeight.min}–{state.event.recommendedWeight.max} kg target</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
