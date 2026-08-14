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
  onRemoveCustom: () => void
}

function bagLabel(bag: Bag): string {
  return `${bag.type.replace('_', ' ')}${bag.brand ? ` (${bag.brand})` : ''}`
}

export function GearRow({
  spec, selected, bags, essential, unnecessary, eventName, unit,
  onToggle, onQty, onAssign, onToggleWorn, onToggleConsumable, onToggleToBuy, onRemoveCustom,
}: GearRowProps) {
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

          <button
            onClick={onToggleWorn}
            aria-pressed={worn}
            title="You'll be wearing this, so it never goes in a bag"
            className={`btn btn-xs min-h-[32px] ${worn ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
          >
            {worn ? '👕 Wearing it' : 'Wearing it'}
          </button>

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

          {worn ? (
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
    </div>
  )
}
