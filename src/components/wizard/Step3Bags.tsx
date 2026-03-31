import { useState, useRef, useEffect } from 'react'
import { useWizard } from '../../hooks/useWizard'
import bagsData from '../../data/bags-bike24.json'
import type { BagPreset, BagType, Bag } from '../../types'
import { bagIcons } from '../../assets/icons/BagIcons'
import gsap from 'gsap'

const bagPresets = bagsData as BagPreset[]

const bagTypes: { type: BagType; label: string; description: string }[] = [
  { type: 'handlebar', label: 'Handlebar', description: 'Front mount. Good for light, bulky items.' },
  { type: 'frame', label: 'Frame', description: 'Center triangle. Best position for heavy items.' },
  { type: 'saddle', label: 'Saddle', description: 'Under the seat. Clothes and camp gear.' },
  { type: 'top_tube', label: 'Top Tube', description: 'Quick-access. Snacks, phone, small items.' },
  { type: 'fork', label: 'Fork Cages', description: 'Fork mounts. Water, heavy items. Low center of gravity.' },
  { type: 'rear_rack', label: 'Rear Rack', description: 'Panniers. Maximum capacity, touring only.' },
]

export function Step3Bags() {
  const { state, dispatch } = useWizard()
  const [expandedType, setExpandedType] = useState<BagType | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const bagByType = new Map<BagType, Bag>()
  for (const b of state.bags) bagByType.set(b.type, b)

  useEffect(() => {
    if (!gridRef.current) return
    gsap.fromTo(gridRef.current.children,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power3.out' }
    )
  }, [])

  function toggleExpand(type: BagType) {
    setExpandedType(prev => prev === type ? null : type)
  }

  function selectPreset(preset: BagPreset) {
    const existing = state.bags.find(b => b.type === preset.type)
    if (existing) dispatch({ type: 'REMOVE_BAG', bagId: existing.id })

    let volume = preset.volume
    if (preset.type === 'frame' && state.bike) volume = Math.min(volume, state.bike.frameBagMaxVolume)

    dispatch({ type: 'ADD_BAG', bag: {
      id: `${preset.type}_${Date.now()}`, type: preset.type, position: preset.position,
      volume, maxWeight: preset.maxWeight, brand: preset.brand, model: preset.model,
      bagWeight: preset.bagWeight, recommended: preset.recommended, items: [],
    }})
  }

  function removeBag(type: BagType) {
    const existing = state.bags.find(b => b.type === type)
    if (existing) dispatch({ type: 'REMOVE_BAG', bagId: existing.id })
  }

  function addCustomBag(type: BagType, volume: number, maxWeight: number) {
    const existing = state.bags.find(b => b.type === type)
    if (existing) dispatch({ type: 'REMOVE_BAG', bagId: existing.id })
    const position = bagPresets.find(p => p.type === type)?.position ?? 'center_low'
    let finalVolume = volume
    if (type === 'frame' && state.bike) finalVolume = Math.min(volume, state.bike.frameBagMaxVolume)
    dispatch({ type: 'ADD_BAG', bag: { id: `${type}_custom_${Date.now()}`, type, position, volume: finalVolume, maxWeight, items: [] }})
  }

  function isPresetSelected(preset: BagPreset): boolean {
    const bag = bagByType.get(preset.type)
    return !!bag && bag.brand === preset.brand && bag.volume === preset.volume
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps text-primary mb-2">Step 3</p>
        <h2 className="heading-xl text-base-content">Pick your bags</h2>
        <p className="text-body text-base-content/60 mt-3 max-w-lg">
          Select the bags you'll be using. Tap a category, then pick a bag.
        </p>
      </div>

      <div ref={gridRef} className="space-y-3">
        {bagTypes.map(({ type, label, description }) => {
          const currentBag = bagByType.get(type)
          const isExpanded = expandedType === type
          const presetsForType = bagPresets.filter(p => p.type === type)
          const sorted = [...presetsForType].sort((a, b) => {
            if (a.recommended && !b.recommended) return -1
            if (!a.recommended && b.recommended) return 1
            return a.volume - b.volume
          })

          return (
            <div key={type} className={`
              card overflow-hidden transition-all duration-300
              ${currentBag ? 'card-selected' : isExpanded ? 'border-2 border-primary/30 bg-base-100' : 'card-border bg-base-100'}
            `}>
              <button onClick={() => toggleExpand(type)}
                className="w-full p-5 flex items-center gap-4 text-left hover:bg-base-200/30 transition-colors">
                {(() => { const Icon = bagIcons[type]; return <Icon className="text-base-content/50" /> })()}
                <div className="flex-1 min-w-0">
                  <div className="heading-md">{label}</div>
                  {!currentBag && <div className="text-small text-base-content/45 mt-0.5">{description}</div>}
                  {currentBag && (
                    <div className="text-small text-primary font-medium mt-0.5">
                      {currentBag.brand && `${currentBag.brand} · `}{currentBag.volume}L · max {currentBag.maxWeight}kg
                      {currentBag.bagWeight && ` · ${currentBag.bagWeight}g`}
                      {currentBag.recommended && ' · ★ Recommended'}
                    </div>
                  )}
                </div>
                {currentBag ? (
                  <span className="badge badge-primary badge-sm">✓</span>
                ) : (
                  <span className="text-small text-base-content/30 font-medium">{isExpanded ? '▲' : '+ Add'}</span>
                )}
              </button>

              {currentBag && !isExpanded && (
                <div className="px-5 pb-4 flex items-center gap-3">
                  <button onClick={() => toggleExpand(type)} className="link link-primary text-small">Change</button>
                  <span className="text-base-content/15">·</span>
                  <button onClick={() => removeBag(type)} className="link link-error text-small">Remove</button>
                </div>
              )}

              {isExpanded && (
                <div className="border-t border-base-300 bg-base-200/30 p-5 space-y-4">
                  {currentBag && (
                    <div className="flex items-center justify-between">
                      <span className="text-small text-base-content/45">Tap another to switch:</span>
                      <button onClick={() => removeBag(type)} className="link link-error text-small">Remove bag</button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {sorted.map(preset => {
                      const selected = isPresetSelected(preset)
                      return (
                        <button key={preset.id} onClick={() => selectPreset(preset)}
                          className={`card p-3.5 text-left transition-all cursor-pointer relative card-hover ${
                            selected ? 'card-selected'
                            : preset.recommended ? 'border-2 border-accent/40 bg-accent/5'
                            : 'card-border bg-base-100'
                          }`}>
                          {selected && <span className="absolute top-2.5 right-2.5 badge badge-primary badge-xs">✓</span>}
                          {!selected && preset.recommended && (
                            <span className="absolute top-2.5 right-2.5 badge badge-accent badge-xs badge-pulse text-[9px]">
                              RECOMMENDED
                            </span>
                          )}
                          <div className="heading-md text-sm pr-20">{preset.label}</div>
                          {preset.brand && (
                            <div className={`text-small font-medium mt-0.5 ${selected ? 'text-primary' : preset.recommended ? 'text-accent' : 'text-secondary'}`}>
                              {preset.brand}
                            </div>
                          )}
                          <div className="text-small text-base-content/35 mt-1">
                            {preset.volume}L · max {preset.maxWeight}kg{preset.bagWeight && ` · ${preset.bagWeight}g`}
                          </div>
                          {preset.basDiscount && (
                            <div className="text-small text-accent font-medium mt-1">BAS community discount</div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <CustomBagInput type={type}
                    maxFrameVolume={type === 'frame' && state.bike ? state.bike.frameBagMaxVolume : undefined}
                    onAdd={(v, w) => addCustomBag(type, v, w)} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {state.bags.length > 0 && (
        <div className="bg-primary/8 border border-primary/15 rounded-xl p-5">
          <p className="text-body text-primary/80 font-medium">
            {state.bags.length} bag{state.bags.length > 1 ? 's' : ''} selected
            · {state.bags.reduce((s, b) => s + b.volume, 0).toFixed(1)}L total capacity
            · {state.bags.reduce((s, b) => s + b.maxWeight, 0).toFixed(1)}kg max weight
            {state.bags.some(b => b.bagWeight) && (
              <span className="text-primary/60">
                {' '}· {(state.bags.reduce((s, b) => s + (b.bagWeight ?? 0), 0) / 1000).toFixed(1)}kg bags weight
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

function CustomBagInput({ type, maxFrameVolume, onAdd }: {
  type: BagType; maxFrameVolume?: number; onAdd: (v: number, w: number) => void
}) {
  const [volume, setVolume] = useState(5)
  const [maxWeight, setMaxWeight] = useState(3)
  return (
    <div className="card card-border bg-base-100 p-4 space-y-3">
      <p className="label-caps text-base-content/40">Custom specs</p>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-small text-base-content/50">Volume (L)</label>
          <input type="number" value={volume} onChange={e => setVolume(Number(e.target.value))}
            min={0.5} max={maxFrameVolume ?? 50} step={0.5} className="input input-sm input-bordered w-full mt-1" />
          {maxFrameVolume && <div className="text-small text-base-content/30 mt-0.5">Max for your frame: {maxFrameVolume}L</div>}
        </div>
        <div className="flex-1">
          <label className="text-small text-base-content/50">Max weight (kg)</label>
          <input type="number" value={maxWeight} onChange={e => setMaxWeight(Number(e.target.value))}
            min={0.5} max={20} step={0.5} className="input input-sm input-bordered w-full mt-1" />
        </div>
      </div>
      <button onClick={() => onAdd(volume, maxWeight)} className="btn btn-primary btn-sm w-full">
        Add custom {type.replace('_', ' ')} bag
      </button>
    </div>
  )
}
