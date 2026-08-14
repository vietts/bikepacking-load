import { useId, useState } from 'react'
import type { ItemCategory, ItemSpec } from '../../types'
import { CATEGORY_LABELS, CATEGORY_ORDER, newCustomItemId } from '../../utils/catalog'

interface AddCustomItemProps {
  defaultCategory: ItemCategory
  onAdd: (item: ItemSpec) => void
}

/**
 * The catalog covers the usual suspects, not the espresso maker someone insists on
 * bringing. Anything added here becomes a real catalog entry for the rest of the
 * session — it packs, weighs and prints exactly like a built-in item.
 */
export function AddCustomItem({ defaultCategory, onAdd }: AddCustomItemProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [volume, setVolume] = useState('')
  const [category, setCategory] = useState<ItemCategory>(defaultCategory)
  const [soft, setSoft] = useState(true)
  const ids = useId()

  const grams = parseFloat(weight)
  const liters = volume.trim() === '' ? 0 : parseFloat(volume)
  const canAdd = name.trim().length > 0 && Number.isFinite(grams) && grams > 0 && Number.isFinite(liters) && liters >= 0

  function submit() {
    if (!canAdd) return
    onAdd({
      id: newCustomItemId(),
      name: name.trim(),
      category,
      weight: { min: grams, max: grams },
      volume: { min: liters, max: liters },
      priority: 'medium',
      shape: 'rectangular',
      rigidity: soft ? 'soft' : 'rigid',
    })
    setName('')
    setWeight('')
    setVolume('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-ghost btn-sm border border-dashed border-base-300 w-full">
        + Add something of your own
      </button>
    )
  }

  return (
    <div className="card card-border bg-base-100 p-4 space-y-3">
      <p className="label-caps text-base-content/60">Your own item</p>

      <div className="space-y-2">
        <label htmlFor={`${ids}-name`} className="text-small text-base-content/70 block">
          What is it?
        </label>
        <input
          id={`${ids}-name`}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Espresso maker"
          className="input input-bordered input-sm w-full"
          autoFocus
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <label htmlFor={`${ids}-weight`} className="text-small text-base-content/70 block">
            Weight (g)
          </label>
          <input
            id={`${ids}-weight`}
            type="number"
            min="1"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="250"
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div className="flex-1 space-y-2">
          <label htmlFor={`${ids}-volume`} className="text-small text-base-content/70 block">
            Size (L) — optional
          </label>
          <input
            id={`${ids}-volume`}
            type="number"
            min="0"
            step="0.1"
            value={volume}
            onChange={e => setVolume(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="0.5"
            className="input input-bordered input-sm w-full"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <label htmlFor={`${ids}-category`} className="text-small text-base-content/70 block">
            Category
          </label>
          <select
            id={`${ids}-category`}
            value={category}
            onChange={e => setCategory(e.target.value as ItemCategory)}
            className="select select-bordered select-sm w-full"
          >
            {CATEGORY_ORDER.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-2">
          <span className="text-small text-base-content/70 block">Squishy?</span>
          <div className="join w-full">
            <button
              type="button"
              onClick={() => setSoft(true)}
              aria-pressed={soft}
              className={`btn btn-sm join-item flex-1 ${soft ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
            >
              Soft
            </button>
            <button
              type="button"
              onClick={() => setSoft(false)}
              aria-pressed={!soft}
              className={`btn btn-sm join-item flex-1 ${!soft ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
            >
              Rigid
            </button>
          </div>
        </div>
      </div>

      <p className="text-small text-base-content/55">
        Soft gear squashes down to fill gaps; rigid gear leaves them. We use this to work out how full each bag really is.
      </p>

      <div className="flex gap-2">
        <button onClick={submit} disabled={!canAdd} className="btn btn-primary btn-sm flex-1">
          Add it
        </button>
        <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
