import { useState, useRef, useEffect, useMemo } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { usePacking } from '../../hooks/usePacking'
import { BUILTIN_ITEMS, CATEGORY_LABELS, CATEGORY_ORDER } from '../../utils/catalog'
import { countUnassigned } from '../../utils/autopack'
import { formatLoad } from '../../utils/units'
import { GearRow } from '../packing/GearRow'
import { BagPanel } from '../packing/BagPanel'
import { AddCustomItem } from '../packing/AddCustomItem'
import type { ItemSpec, ItemCategory } from '../../types'
import gsap from 'gsap'

export function Step4Pack() {
  const { state, dispatch } = useWizard()
  const packing = usePacking(state)
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('clothes')
  const [query, setQuery] = useState('')
  const itemsRef = useRef<HTMLDivElement>(null)

  // Hand-added and imported gear sits alongside the catalog, newest first so it's
  // easy to find right after adding it.
  const allItems = useMemo<ItemSpec[]>(
    () => [...state.customItems].reverse().concat(BUILTIN_ITEMS),
    [state.customItems]
  )

  const search = query.trim().toLowerCase()
  // Searching spans the whole catalog — with 48+ items plus your own, hunting
  // through seven tabs to find "pump" is the wrong job for a human.
  const visibleItems = search
    ? allItems.filter(i => i.name.toLowerCase().includes(search))
    : allItems.filter(i => i.category === activeCategory)

  const selectedById = new Map(state.selectedItems.map(i => [i.itemId, i]))
  const unassignedCount = countUnassigned(state)

  useEffect(() => {
    if (!itemsRef.current) return
    gsap.fromTo(itemsRef.current.children,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.03, ease: 'power2.out' }
    )
  }, [activeCategory, search])

  function toggleItem(item: ItemSpec) {
    const avgWeight = Math.round((item.weight.min + item.weight.max) / 2)
    const avgVolume = +((item.volume.min + item.volume.max) / 2).toFixed(2)
    dispatch({ type: 'TOGGLE_ITEM', itemId: item.id, weight: avgWeight, volume: avgVolume })
  }

  const showWorn = packing.wornWeight >= 50
  const showConsumable = packing.consumableWeight >= 50

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps text-primary mb-2">Step 4</p>
        <h2 className="heading-xl text-base-content">Pack your gear</h2>
        <p className="text-body text-base-content/70 mt-3 max-w-lg">
          {state.event ? (
            <>We've pre-packed the essentials for <span className="font-semibold text-base-content">{state.event.name}</span> — add or remove anything you like, then assign items to your bags.</>
          ) : (
            <>Select items and assign them to your bags.</>
          )}
        </p>
      </div>

      <div className="lg:flex lg:gap-8">
        {/* Left: Gear list */}
        <div className="flex-1 space-y-4">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search all gear…"
            aria-label="Search gear"
            className="input input-bordered w-full"
          />

          {/* Category tabs — wrap so no category is ever hidden off-screen */}
          {!search && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {CATEGORY_ORDER.map(cat => {
                const count = allItems.filter(i => i.category === cat && selectedById.has(i.id)).length
                const total = allItems.filter(i => i.category === cat).length
                if (total === 0) return null
                return (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-ghost bg-base-100'}`}>
                    {CATEGORY_LABELS[cat]}
                    {count > 0 && <span className="opacity-60 ml-0.5">({count})</span>}
                  </button>
                )
              })}
            </div>
          )}

          <div ref={itemsRef} className="space-y-2">
            {visibleItems.map(item => (
              <GearRow
                key={item.id}
                spec={item}
                selected={selectedById.get(item.id)}
                bags={state.bags}
                essential={state.event?.essentialItems.includes(item.id) ?? false}
                unnecessary={state.event?.unnecessaryItems.includes(item.id) ?? false}
                eventName={state.event?.name}
                unit={state.unit}
                onToggle={() => toggleItem(item)}
                onQty={qty => dispatch({ type: 'SET_QTY', itemId: item.id, qty })}
                onAssign={bagId => dispatch({ type: 'ASSIGN_ITEM', itemId: item.id, bagId })}
                onToggleWorn={() => dispatch({ type: 'TOGGLE_WORN', itemId: item.id })}
                onToggleConsumable={() => dispatch({ type: 'TOGGLE_CONSUMABLE', itemId: item.id })}
                onRemoveCustom={() => dispatch({ type: 'REMOVE_CUSTOM_ITEM', itemId: item.id })}
              />
            ))}
            {visibleItems.length === 0 && (
              <p className="text-body text-base-content/60 py-6 text-center">
                Nothing matches "{query}". Add it yourself below.
              </p>
            )}
          </div>

          <AddCustomItem
            defaultCategory={search ? 'other' : activeCategory}
            onAdd={item => {
              dispatch({ type: 'ADD_CUSTOM_ITEM', item, select: true })
              setQuery('')
              setActiveCategory(item.category)
            }}
          />
        </div>

        {/* Right: Bag view */}
        <div className="lg:w-80 mt-8 lg:mt-0 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="label-caps text-base-content/60">Your bags</p>
            {state.bags.length > 0 && unassignedCount > 0 && (
              <button
                onClick={() => dispatch({ type: 'AUTO_ASSIGN' })}
                className="btn btn-primary btn-xs"
              >
                Pack for me ({unassignedCount})
              </button>
            )}
          </div>

          {state.bags.map(bag => {
            const stats = packing.bagStats[bag.id]
            if (!stats) return null
            return (
              <BagPanel
                key={bag.id}
                bag={bag}
                stats={stats}
                items={state.selectedItems.filter(i => i.bagId === bag.id && !i.worn)}
                catalog={packing.catalog}
                unit={state.unit}
              />
            )
          })}

          <div className={`card p-4 text-center border-2 ${
            packing.isOverMaxWeight ? 'border-error bg-error/8 text-error'
            : packing.isInRecommendedRange ? 'border-success bg-success/8 text-success'
            : 'border-warning bg-warning/8 text-warning'
          }`}>
            <div className="font-semibold">
              {formatLoad(packing.onBikeWeight, state.unit)}
              {state.event && (
                <span className="font-normal text-small"> / {formatLoad(state.event.recommendedWeight.min * 1000, state.unit)}–{formatLoad(state.event.recommendedWeight.max * 1000, state.unit)} target</span>
              )}
            </div>
            <div className="text-small opacity-70">on the bike</div>
            {(showWorn || showConsumable) && (
              <div className="text-small opacity-70 mt-1 border-t border-current/15 pt-1.5 space-y-0.5">
                {showWorn && <div>+ {formatLoad(packing.wornWeight, state.unit)} you're wearing</div>}
                {showConsumable && <div>of which {formatLoad(packing.consumableWeight, state.unit)} you'll eat or drink</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
