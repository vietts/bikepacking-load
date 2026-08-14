import { useState, useRef, useEffect, useMemo } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { BUILTIN_ITEMS, CATEGORY_LABELS, CATEGORY_ORDER } from '../../utils/catalog'
import { GearRow } from '../packing/GearRow'
import { AddCustomItem } from '../packing/AddCustomItem'
import type { ItemSpec, ItemCategory } from '../../types'
import gsap from 'gsap'

export function Step4Gear() {
  const { state, dispatch, nextStep } = useWizard()
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('clothes')
  const [query, setQuery] = useState('')
  // Categories the rider has already looked at — the guided "Next" walk marks
  // them off so it's clear the whole list has been covered, not just one tab.
  const [visited, setVisited] = useState<Set<ItemCategory>>(() => new Set(['clothes']))
  const itemsRef = useRef<HTMLDivElement>(null)

  // Hand-added and imported gear sits alongside the catalog, newest first so it's
  // easy to find right after adding it.
  const allItems = useMemo<ItemSpec[]>(
    () => [...state.customItems].reverse().concat(BUILTIN_ITEMS),
    [state.customItems]
  )

  const search = query.trim().toLowerCase()
  // Searching spans the whole catalog — with 48+ items plus your own, hunting
  // through category tabs to find "pump" is the wrong job for a human.
  const visibleItems = search
    ? allItems.filter(i => i.name.toLowerCase().includes(search))
    : allItems.filter(i => i.category === activeCategory)

  const selectedById = new Map(state.selectedItems.map(i => [i.itemId, i]))

  // Assignment to bags happens later, one bag at a time (Step 5) — this list is
  // purely "what am I bringing", so GearRow never renders a bag-assign control here.
  const noBags: never[] = []

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

  const totalWeightKg = state.selectedItems.reduce((s, i) => s + i.weight * i.qty, 0) / 1000
  const essentialCount = state.event
    ? state.event.essentialItems.filter(id => selectedById.has(id)).length
    : 0
  const essentialTotal = state.event?.essentialItems.length ?? 0

  // The guided walk only visits categories that actually contain items.
  const categories = CATEGORY_ORDER.filter(cat => allItems.some(i => i.category === cat))
  const categoryIndex = categories.indexOf(activeCategory)
  const nextCategory = categoryIndex >= 0 && categoryIndex < categories.length - 1
    ? categories[categoryIndex + 1]
    : null

  function selectCategory(cat: ItemCategory) {
    setActiveCategory(cat)
    setVisited(prev => prev.has(cat) ? prev : new Set(prev).add(cat))
  }

  function goToCategory(cat: ItemCategory) {
    selectCategory(cat)
    setQuery('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps text-primary mb-2">Step 4</p>
        <h2 className="heading-xl text-base-content">Build your gear list</h2>
        <p className="text-body text-base-content/60 mt-3 max-w-lg">
          A first draft, not the final word — essentials for {state.event?.name ?? 'your trip'} are
          already checked. Next you'll pack each bag, one at a time.
        </p>
      </div>

      {/* Essentials completion — one glance answers "am I missing anything vital?" */}
      {state.event && essentialTotal > 0 && (
        <div className={`card p-4 border-2 ${
          essentialCount === essentialTotal ? 'border-success/30 bg-success/5' : 'card-border bg-base-100'
        }`}>
          <div className="flex justify-between items-baseline mb-2">
            <span className={`text-small font-semibold ${essentialCount === essentialTotal ? 'text-success' : 'text-base-content/70'}`}>
              {essentialCount === essentialTotal ? '✓ All essentials covered' : `Essentials for ${state.event.name}`}
            </span>
            <span className={`text-small tabular-nums font-semibold ${essentialCount === essentialTotal ? 'text-success' : 'text-base-content/60'}`}>
              {essentialCount}/{essentialTotal}
            </span>
          </div>
          <progress
            className={`progress w-full h-2.5 ${essentialCount === essentialTotal ? 'progress-success' : 'progress-primary'}`}
            value={essentialCount} max={essentialTotal}
          />
        </div>
      )}

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

          {/* Category tabs — hidden while searching, so results aren't filtered twice.
              Visited categories get a check so the walk-through reads as a checklist. */}
          {!search && (
            <div className="flex flex-wrap gap-1.5 pb-1">
              {categories.map(cat => {
                const count = allItems.filter(i => i.category === cat && selectedById.has(i.id)).length
                const seen = visited.has(cat) && cat !== activeCategory
                return (
                  <button key={cat} onClick={() => selectCategory(cat)}
                    className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-ghost bg-base-100'}`}>
                    {seen && <span className="text-success -mr-0.5">✓</span>}
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
                bags={noBags}
                essential={state.event?.essentialItems.includes(item.id) ?? false}
                unnecessary={state.event?.unnecessaryItems.includes(item.id) ?? false}
                eventName={state.event?.name}
                unit={state.unit}
                onToggle={() => toggleItem(item)}
                onQty={qty => dispatch({ type: 'SET_QTY', itemId: item.id, qty })}
                onAssign={() => {}}
                onToggleWorn={() => dispatch({ type: 'TOGGLE_WORN', itemId: item.id })}
                onToggleConsumable={() => dispatch({ type: 'TOGGLE_CONSUMABLE', itemId: item.id })}
                onToggleToBuy={() => dispatch({ type: 'TOGGLE_TO_BUY', itemId: item.id })}
                onNote={note => dispatch({ type: 'SET_ITEM_NOTE', itemId: item.id, note })}
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
              selectCategory(item.category)
            }}
          />

          {/* Guided walk: one big CTA moves category by category, so "did I cover
              everything?" answers itself. The wizard-level Continue is hidden here. */}
          {!search && (
            <div className="pt-2 space-y-2">
              {nextCategory ? (
                <button onClick={() => goToCategory(nextCategory)} className="btn btn-primary btn-lg w-full">
                  Next: {CATEGORY_LABELS[nextCategory]} →
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={state.selectedItems.length === 0}
                  className="btn btn-primary btn-lg w-full"
                >
                  Continue to packing →
                </button>
              )}
              <p className="text-small text-base-content/40 text-center">
                Category {categoryIndex + 1} of {categories.length}
                {nextCategory && ' · you can also jump around with the tabs above'}
              </p>
            </div>
          )}
        </div>

        {/* Right: running summary */}
        <div className="lg:w-72 mt-8 lg:mt-0 space-y-3 lg:sticky lg:top-24 self-start">
          <p className="label-caps text-base-content/40">Your list so far</p>

          <div className="card card-border bg-base-100 p-5 text-center space-y-1">
            <div className="text-4xl font-bold font-[var(--font-heading)] tracking-tight">
              {totalWeightKg.toFixed(1)}<span className="text-lg text-base-content/40 ml-1">kg</span>
            </div>
            <div className="text-small text-base-content/40">
              {state.selectedItems.length} item{state.selectedItems.length === 1 ? '' : 's'} selected
            </div>
            {state.event && (
              <div className={`text-small font-medium ${
                totalWeightKg > state.event.maxAcceptableWeight ? 'text-error'
                : totalWeightKg > state.event.recommendedWeight.max ? 'text-warning'
                : 'text-success'
              }`}>
                Target: {state.event.recommendedWeight.min}–{state.event.recommendedWeight.max} kg
              </div>
            )}
          </div>

          <div className="bg-primary/8 border border-primary/15 rounded-xl p-4">
            <p className="text-small text-primary/80">
              Don't stress about where things go yet — in the next step you'll fill one bag at a time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
