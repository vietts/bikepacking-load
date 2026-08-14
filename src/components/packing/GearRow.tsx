import { useState } from 'react'
import type { Bag, ItemSpec, SelectedItem, UnitSystem } from '../../types'
import { isCustomItem } from '../../utils/catalog'
import { formatItemWeight, formatVolume } from '../../utils/units'

interface GearRowProps {
  spec: ItemSpec
  selected: SelectedItem | undefined
  bags: Bag[]
  essential: boolean
  unnecessary: boolean
  eventName?: string
  unit: UnitSystem
  onToggle: () => void
  onQty: (qty: number) => void
  onAssign: (bagId: string | null) => void
  onToggleWorn: () => void
  onToggleConsumable: () => void
  onToggleToBuy: () => void
  onNote: (note: string) => void
  onRemoveCustom: () => void
}

function bagLabel(bag: Bag): string {
  return `${bag.type.replace('_', ' ')}${bag.brand ? ` (${bag.brand})` : ''}`
}

export function GearRow({
  spec, selected, bags, essential, unnecessary, eventName, unit,
  onToggle, onQty, onAssign, onToggleWorn, onToggleConsumable, onToggleToBuy, onNote, onRemoveCustom,
}: GearRowProps) {
  const [editingNote, setEditingNote] = useState(false)
  const weightRange = spec.weight.min === spec.weight.max
    ? formatItemWeight(spec.weight.min, unit)
    : `${formatItemWeight(spec.weight.min, unit)}–${formatItemWeight(spec.weight.max, unit)}`
  const volumeRange = spec.volume.min === spec.volume.max
    ? formatVolume(spec.volume.min, unit)
    : `${formatVolume(spec.volume.min, unit)}–${formatVolume(spec.volume.max, unit)}`
  const isSelected = !!selected
  const qty = selected?.qty ?? 1
  const worn = selected?.worn ?? false
  const consumable = selected?.consumable ?? false
  const toBuy = selected?.toBuy ?? false
  const custom = isCustomItem(spec.id)
  const noVolume = custom && spec.volume.max === 0
  const mounted = spec.category === 'mounted'

  return (
    <div
      className={`card card-border p-3.5 transition-all ${
        isSelected
          ? essential ? 'card-selected !border-success !bg-success/5' : 'card-selected'
          : unnecessary ? 'border-warning/20 bg-warning/3' : 'bg-base-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <label className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer py-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="checkbox checkbox-primary mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{spec.name}</span>
              {essential && <span className="badge badge-success badge-xs">ESSENTIAL</span>}
              {spec.priority === 'conditional' && <span className="badge badge-warning badge-xs">CONDITIONAL</span>}
              {custom && <span className="badge badge-ghost badge-xs">YOURS</span>}
            </div>
            <div className="text-small text-base-content/60 mt-0.5">
              {weightRange}
              {spec.volume.max > 0 && <> · {volumeRange}</>}
              {qty > 1 && (
                <> · <span className="font-semibold text-base-content/80">
                  {formatItemWeight(selected!.weight * qty, unit)} total
                </span></>
              )}
            </div>
            {spec.note && <div className="text-small text-base-content/60 mt-0.5 italic">{spec.note}</div>}
            {selected?.note && !editingNote && (
              <div className="text-small text-primary/90 mt-0.5">✎ {selected.note}</div>
            )}
            {noVolume && isSelected && (
              <div className="text-small text-base-content/60 mt-0.5">
                No size on this one — it won't count toward how full your bags are.
              </div>
            )}
            {unnecessary && isSelected && (
              <div className="text-small text-warning font-medium mt-1">
                💡 For {eventName} you probably won't need this.
              </div>
            )}
          </div>
        </label>

        {custom && (
          <button
            onClick={onRemoveCustom}
            aria-label={`Delete ${spec.name}`}
            className="btn btn-ghost btn-xs text-base-content/40 hover:text-error shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {isSelected && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pl-8">
          {/* Quantity */}
          <div className="join border border-base-300 rounded-lg">
            <button
              onClick={() => onQty(qty - 1)}
              disabled={qty <= 1}
              aria-label={`One less ${spec.name}`}
              className="btn btn-ghost btn-xs join-item px-2.5 min-h-[32px]"
            >
              −
            </button>
            <span className="join-item px-2 text-small font-semibold tabular-nums self-center min-w-[2.5rem] text-center">
              ×{qty}
            </span>
            <button
              onClick={() => onQty(qty + 1)}
              aria-label={`One more ${spec.name}`}
              className="btn btn-ghost btn-xs join-item px-2.5 min-h-[32px]"
            >
              +
            </button>
          </div>

          {!mounted && (
            <button
              onClick={onToggleWorn}
              aria-pressed={worn}
              title="You'll be wearing this, so it never goes in a bag"
              className={`btn btn-xs min-h-[32px] ${worn ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
            >
              {worn ? '👕 Wearing it' : 'Wearing it'}
            </button>
          )}

          <button
            onClick={onToggleConsumable}
            aria-pressed={consumable}
            title="Food, water, gas — this weight disappears as you ride"
            className={`btn btn-xs min-h-[32px] ${consumable ? 'btn-secondary' : 'btn-ghost border border-base-300'}`}
          >
            {consumable ? '🍫 Eat/drink' : 'Eat/drink'}
          </button>

          <button
            onClick={onToggleToBuy}
            aria-pressed={toBuy}
            title="You don't own this yet — it goes on the shopping list of your checklist"
            className={`btn btn-xs min-h-[32px] ${toBuy ? 'btn-accent' : 'btn-ghost border border-base-300'}`}
          >
            {toBuy ? '🛒 To buy' : 'To buy'}
          </button>

          <button
            onClick={() => setEditingNote(e => !e)}
            aria-expanded={editingNote}
            title="A reminder to yourself — which ones, how many, where they are"
            className="btn btn-xs btn-ghost border border-base-300 min-h-[32px]"
          >
            ✎ Note
          </button>

          {mounted ? (
            <span className="text-small text-base-content/50 italic">on its own mount, not in a bag</span>
          ) : worn ? (
            <span className="text-small text-base-content/50 italic">on you, not on the bike</span>
          ) : bags.length > 0 && (
            <select
              value={selected?.bagId ?? ''}
              onChange={e => onAssign(e.target.value || null)}
              aria-label={`Assign ${spec.name} to a bag`}
              className="select select-xs select-bordered min-h-[32px] capitalize"
            >
              <option value="">Unassigned</option>
              {bags.map(bag => (
                <option key={bag.id} value={bag.id}>→ {bagLabel(bag)}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {isSelected && editingNote && (
        <div className="mt-2 pl-8">
          <input
            type="text"
            defaultValue={selected?.note ?? ''}
            placeholder="e.g. USB-C x2, Garmin x1"
            maxLength={200}
            autoFocus
            aria-label={`Note for ${spec.name}`}
            onBlur={e => { onNote(e.target.value); setEditingNote(false) }}
            onKeyDown={e => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setEditingNote(false)
            }}
            className="input input-sm input-bordered w-full"
          />
        </div>
      )}
    </div>
  )
}
