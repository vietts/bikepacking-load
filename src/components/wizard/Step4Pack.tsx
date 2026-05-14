import { useState, useRef, useEffect } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { usePacking, getItemSpec } from '../../hooks/usePacking'
import itemsData from '../../data/items.json'
import type { ItemSpec, ItemCategory, BagType } from '../../types'
import { BikeViewer } from './BikeViewer'
import gsap from 'gsap'

const items = itemsData as ItemSpec[]

const categories: { id: ItemCategory; label: string }[] = [
  { id: 'clothes', label: 'Clothes' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'tech', label: 'Tech' },
  { id: 'repair', label: 'Repair' },
  { id: 'hygiene', label: 'Hygiene' },
  { id: 'food', label: 'Food' },
  { id: 'docs', label: 'Docs' },
]

const FALLBACK_BAG_ORDER: BagType[] = ['frame', 'saddle', 'handlebar', 'top_tube', 'fork', 'rear_rack']

export function Step4Pack() {
  const { state, dispatch } = useWizard()
  const packing = usePacking(state)
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('clothes')
  const [highlightBagId, setHighlightBagId] = useState<string | null>(null)
  const itemsRef = useRef<HTMLDivElement>(null)

  const categoryItems = items.filter(i => i.category === activeCategory)
  const selectedItemIds = new Set(state.selectedItems.map(i => i.itemId))

  function pickBagIdForType(preferred: BagType | undefined): string | null {
    if (preferred) {
      const match = state.bags.find(b => b.type === preferred)
      if (match) return match.id
    }
    for (const t of FALLBACK_BAG_ORDER) {
      const match = state.bags.find(b => b.type === t)
      if (match) return match.id
    }
    return null
  }

  function smartPack() {
    if (!state.event || state.bags.length === 0) return

    // 1. Add essentials not already selected
    for (const itemId of state.event.essentialItems) {
      if (selectedItemIds.has(itemId)) continue
      const item = items.find(i => i.id === itemId)
      if (!item) continue
      const avgWeight = Math.round((item.weight.min + item.weight.max) / 2)
      const avgVolume = +((item.volume.min + item.volume.max) / 2).toFixed(2)
      dispatch({ type: 'TOGGLE_ITEM', itemId, weight: avgWeight, volume: avgVolume })
    }

    // 2. Auto-assign any unassigned item (existing + newly added) to its preferredBag (or fallback)
    const allToAssign = new Set<string>([
      ...state.selectedItems.filter(i => i.bagId === null).map(i => i.itemId),
      ...state.event.essentialItems.filter(id => !selectedItemIds.has(id)),
    ])
    for (const itemId of allToAssign) {
      const item = items.find(i => i.id === itemId)
      if (!item) continue
      const bagId = pickBagIdForType(item.preferredBag)
      if (bagId) dispatch({ type: 'ASSIGN_ITEM', itemId, bagId })
    }
  }

  // Animate items when category changes
  useEffect(() => {
    if (!itemsRef.current) return
    gsap.fromTo(itemsRef.current.children,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.03, ease: 'power2.out' }
    )
  }, [activeCategory])

  function isEssential(itemId: string): boolean {
    return state.event?.essentialItems.includes(itemId) ?? false
  }
  function isUnnecessary(itemId: string): boolean {
    return state.event?.unnecessaryItems.includes(itemId) ?? false
  }

  function toggleItem(item: ItemSpec) {
    const avgWeight = Math.round((item.weight.min + item.weight.max) / 2)
    const avgVolume = +((item.volume.min + item.volume.max) / 2).toFixed(2)
    dispatch({ type: 'TOGGLE_ITEM', itemId: item.id, weight: avgWeight, volume: avgVolume })

    // If item is being added and has a preferred bag available, auto-assign
    const isBeingAdded = !selectedItemIds.has(item.id)
    if (isBeingAdded) {
      const bagId = pickBagIdForType(item.preferredBag)
      if (bagId) {
        dispatch({ type: 'ASSIGN_ITEM', itemId: item.id, bagId })
        setHighlightBagId(bagId)
        window.setTimeout(() => setHighlightBagId(null), 1400)
      }
    }
  }

  function assignToBag(itemId: string, bagId: string | null) {
    dispatch({ type: 'ASSIGN_ITEM', itemId, bagId })
    if (bagId) {
      setHighlightBagId(bagId)
      window.setTimeout(() => setHighlightBagId(null), 1400)
    }
  }

  const unassignedCount = state.selectedItems.filter(i => i.bagId === null).length
  const missingEssentials = state.event
    ? state.event.essentialItems.filter(id => !selectedItemIds.has(id)).length
    : 0
  const canSmartPack = state.bags.length > 0 && (missingEssentials > 0 || unassignedCount > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-primary mb-2">Step 4</p>
          <h2 className="heading-xl text-base-content">Pack your gear</h2>
          <p className="text-body text-base-content/60 mt-3 max-w-lg">
            Tick what you're bringing — we'll drop each item into the right bag automatically. Watch the bike on the right fill up.
          </p>
        </div>

        {canSmartPack && (
          <button
            onClick={smartPack}
            className="btn btn-accent btn-sm gap-2 self-start sm:self-auto"
            title={missingEssentials > 0
              ? `Add ${missingEssentials} missing essential${missingEssentials > 1 ? 's' : ''} and arrange everything`
              : 'Auto-assign unpacked items to the right bags'}
          >
            ✨ Pack for me
          </button>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-10 space-y-6 lg:space-y-0">
        {/* Left: Gear list */}
        <div className="flex-1 min-w-0 space-y-4 lg:order-1">
          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map(cat => {
              const count = items.filter(i => i.category === cat.id && selectedItemIds.has(i.id)).length
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={`btn btn-sm ${activeCategory === cat.id ? 'btn-primary' : 'btn-ghost bg-base-100'}`}>
                  {cat.label}
                  {count > 0 && <span className="opacity-60 ml-0.5">({count})</span>}
                </button>
              )
            })}
          </div>

          {/* Items */}
          <div ref={itemsRef} className="space-y-2">
            {categoryItems.map(item => {
              const isSelected = selectedItemIds.has(item.id)
              const selectedItem = state.selectedItems.find(i => i.itemId === item.id)
              const essential = isEssential(item.id)
              const unnecessary = isUnnecessary(item.id)

              return (
                <div key={item.id}
                  className={`card card-border p-3.5 transition-all ${
                    isSelected
                      ? essential ? 'card-selected !border-success !bg-success/5' : 'card-selected'
                      : unnecessary ? 'border-warning/20 bg-warning/3' : 'bg-base-100'
                  }`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item)}
                      className="checkbox checkbox-sm checkbox-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{item.name}</span>
                        {essential && <span className="badge badge-success badge-xs">ESSENTIAL</span>}
                        {item.priority === 'conditional' && <span className="badge badge-warning badge-xs">CONDITIONAL</span>}
                      </div>
                      <div className="text-small text-base-content/35 mt-0.5">
                        {item.weight.min === item.weight.max ? `${item.weight.min}g` : `${item.weight.min}–${item.weight.max}g`}
                        {item.volume.max > 0 && (<> · {item.volume.min === item.volume.max ? `${item.volume.min}L` : `${item.volume.min}–${item.volume.max}L`}</>)}
                      </div>
                      {item.note && <div className="text-small text-base-content/40 mt-0.5 italic">{item.note}</div>}
                      {unnecessary && isSelected && (
                        <div className="text-small text-warning font-medium mt-1">
                          💡 For {state.event?.name} you probably won't need this.
                        </div>
                      )}
                    </div>
                    {isSelected && state.bags.length > 0 && (
                      <select value={selectedItem?.bagId ?? ''} onChange={e => assignToBag(item.id, e.target.value || null)}
                        className="select select-xs select-bordered shrink-0">
                        <option value="">Unassigned</option>
                        {state.bags.map(bag => (
                          <option key={bag.id} value={bag.id}>→ {bag.type.replace('_', ' ')}{bag.brand ? ` (${bag.brand})` : ''}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Bike viewer + bag stats */}
        <aside className="lg:order-2 lg:sticky lg:top-24 lg:self-start space-y-4">
          <BikeViewer
            bike={state.bike}
            bags={state.bags}
            bagStats={packing.bagStats}
            distribution={packing.distribution}
            highlightBagId={highlightBagId}
          />

          <p className="label-caps text-base-content/40">Your bags</p>

          {state.bags.map(bag => {
            const stats = packing.bagStats[bag.id]
            if (!stats) return null
            const assignedItems = state.selectedItems.filter(i => i.bagId === bag.id)
            const isOverloaded = stats.overWeight || stats.overVolume
            const isNearLimit = !isOverloaded && (stats.weightPercent > 80 || stats.volumePercent > 90)

            return (
              <div key={bag.id} className={`card p-4 space-y-2.5 border-2 transition-colors ${
                isOverloaded ? 'border-error bg-error/5' : isNearLimit ? 'border-warning bg-warning/5' : 'card-border bg-base-100'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="heading-md text-sm">
                    {bag.type.replace('_', ' ')}
                    {bag.brand && <span className="text-base-content/35 font-normal"> · {bag.brand}</span>}
                  </span>
                  <span className={`text-small ${isOverloaded ? 'text-error font-bold' : 'text-base-content/35'}`}>
                    {(stats.totalWeight / 1000).toFixed(1)} / {bag.maxWeight}kg
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className={stats.overWeight ? 'text-error font-bold' : 'text-base-content/35'}>
                      Weight {stats.overWeight && '— over limit!'}
                    </span>
                    <span className={stats.overWeight ? 'text-error font-bold' : 'text-base-content/35'}>
                      {Math.round(stats.weightPercent)}%
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
                  {stats.effectiveVolume !== stats.totalVolume && stats.totalVolume > 0 && (
                    <div className="text-[10px] text-base-content/25 mt-0.5">
                      {stats.effectiveVolume > stats.totalVolume
                        ? `Hard items leave gaps inside, so they take more room than their numbers say (${stats.totalVolume.toFixed(1)}L → ${stats.effectiveVolume.toFixed(1)}L).`
                        : `Soft stuff squishes down nicely (${stats.totalVolume.toFixed(1)}L → ${stats.effectiveVolume.toFixed(1)}L).`
                      }
                    </div>
                  )}
                </div>

                {isOverloaded && (
                  <div className="bg-error/10 rounded-lg px-3 py-2 text-small text-error">
                    {stats.overWeight && stats.overVolume
                      ? `This one's overloaded — about ${((stats.totalWeight / 1000) - bag.maxWeight).toFixed(1)}kg and ${(stats.effectiveVolume - bag.volume).toFixed(1)}L too much. Move something into another bag.`
                      : stats.overWeight
                        ? `${((stats.totalWeight / 1000) - bag.maxWeight).toFixed(1)}kg over what this bag was made for. Heavy stuff is happiest in the frame bag.`
                        : `Won't all fit — you've packed about ${stats.effectiveVolume.toFixed(1)}L into a ${bag.volume}L bag. Try moving something out, or swap a hard item for a softer one.`}
                  </div>
                )}
                {isNearLimit && (
                  <div className="bg-warning/10 rounded-lg px-3 py-2 text-small text-warning">
                    Almost full. Leave a little room for snacks and the things you'll pick up along the way.
                  </div>
                )}

                <div className="flex flex-wrap gap-1 min-h-[24px]">
                  {assignedItems.length === 0 ? (
                    <span className="text-small text-base-content/20 italic">Empty</span>
                  ) : assignedItems.map(si => (
                    <span key={si.itemId} className="badge badge-sm badge-soft badge-primary">{getItemSpec(si.itemId)?.name ?? si.itemId}</span>
                  ))}
                </div>
              </div>
            )
          })}

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
        </aside>
      </div>
    </div>
  )
}
