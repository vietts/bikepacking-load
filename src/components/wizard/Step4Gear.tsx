import { useState, useRef, useEffect } from 'react'
import { useWizard } from '../../hooks/useWizard'
import itemsData from '../../data/items.json'
import type { ItemSpec, ItemCategory } from '../../types'
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

export function Step4Gear() {
  const { state, dispatch } = useWizard()
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('clothes')
  const itemsRef = useRef<HTMLDivElement>(null)

  const categoryItems = items.filter(i => i.category === activeCategory)
  const selectedItemIds = new Set(state.selectedItems.map(i => i.itemId))

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
  }

  const totalWeightKg = state.selectedItems.reduce((s, i) => s + i.weight, 0) / 1000
  const essentialCount = state.event
    ? state.event.essentialItems.filter(id => selectedItemIds.has(id)).length
    : 0

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

      <div className="lg:flex lg:gap-8">
        {/* Left: Gear list */}
        <div className="flex-1 space-y-4">
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
              const essential = isEssential(item.id)
              const unnecessary = isUnnecessary(item.id)

              return (
                <div key={item.id}
                  className={`card card-border p-3.5 transition-all ${
                    isSelected
                      ? essential ? 'card-selected !border-success !bg-success/5' : 'card-selected'
                      : unnecessary ? 'border-warning/20 bg-warning/3' : 'bg-base-100'
                  }`}>
                  <label className="flex items-start gap-3 cursor-pointer">
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
                  </label>
                </div>
              )
            })}
          </div>
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

          {state.event && (
            <div className="card card-border bg-base-100 p-4">
              <div className="text-small text-base-content/50">
                <span className="font-semibold text-success">{essentialCount}/{state.event.essentialItems.length}</span> essentials
                for {state.event.name} in your list
              </div>
            </div>
          )}

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
