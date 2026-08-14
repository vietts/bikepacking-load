import type { Bag, SelectedItem, UnitSystem } from '../../types'
import type { BagStats } from '../../hooks/usePacking'
import type { Catalog } from '../../utils/catalog'
import { formatVolume, loadUnit, loadValue } from '../../utils/units'

interface BagPanelProps {
  bag: Bag
  stats: BagStats
  items: SelectedItem[]
  catalog: Catalog
  unit: UnitSystem
}

export function BagPanel({ bag, stats, items, catalog, unit }: BagPanelProps) {
  const isOverloaded = stats.overWeight || stats.overVolume
  const isNearLimit = !isOverloaded && (stats.weightPercent > 80 || stats.volumePercent > 90)
  const load = (grams: number) => loadValue(grams, unit)
  const vol = (liters: number) => formatVolume(liters, unit)

  return (
    <div
      className={`card p-4 space-y-2.5 border-2 transition-colors ${
        isOverloaded ? 'border-error bg-error/5' : isNearLimit ? 'border-warning bg-warning/5' : 'card-border bg-base-100'
      }`}
    >
      <div className="flex justify-between items-center">
        <span className="heading-md text-sm capitalize">
          {bag.type.replace('_', ' ')}
          {bag.brand && <span className="text-base-content/60 font-normal"> · {bag.brand}</span>}
        </span>
        <span className={`text-small ${isOverloaded ? 'text-error font-bold' : 'text-base-content/60'}`}>
          {load(stats.totalWeight)} / {load(bag.maxWeight * 1000)}{loadUnit(unit)}
        </span>
      </div>

      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className={stats.overWeight ? 'text-error font-bold' : 'text-base-content/60'}>
            Weight {stats.overWeight && '— over limit!'}
          </span>
          <span className={stats.overWeight ? 'text-error font-bold' : 'text-base-content/60'}>
            {Math.round(stats.weightPercent)}%
          </span>
        </div>
        <progress
          className={`progress w-full h-2 ${stats.overWeight ? 'progress-error' : stats.weightPercent > 80 ? 'progress-warning' : 'progress-success'}`}
          value={Math.min(100, stats.weightPercent)}
          max="100"
        />
      </div>

      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className={stats.overVolume ? 'text-error font-bold' : 'text-base-content/60'}>
            Space used {stats.overVolume && "— won't fit!"}
          </span>
          <span className={stats.overVolume ? 'text-error font-bold' : 'text-base-content/60'}>
            {vol(stats.effectiveVolume)} / {vol(bag.volume)}
          </span>
        </div>
        <progress
          className={`progress w-full h-2 ${stats.overVolume ? 'progress-error' : stats.volumePercent > 90 ? 'progress-warning' : 'progress-info'}`}
          value={Math.min(100, stats.volumePercent)}
          max="100"
        />
        {stats.effectiveVolume !== stats.totalVolume && stats.totalVolume > 0 && (
          <div className="text-[10px] text-base-content/55 mt-0.5">
            {stats.effectiveVolume > stats.totalVolume
              ? `Rigid/cylindrical items take up more space than their size (${vol(stats.totalVolume)} → ${vol(stats.effectiveVolume)})`
              : `Soft items compress to fill gaps (${vol(stats.totalVolume)} → ${vol(stats.effectiveVolume)})`}
          </div>
        )}
      </div>

      {isOverloaded && (
        <div className="bg-error/10 rounded-lg px-3 py-2 text-small text-error">
          {stats.overWeight && stats.overVolume
            ? `Too heavy and too full. Move ${load(stats.totalWeight - bag.maxWeight * 1000)}${loadUnit(unit)} and ${vol(stats.effectiveVolume - bag.volume)} worth of items to another bag.`
            : stats.overWeight
              ? `${load(stats.totalWeight - bag.maxWeight * 1000)}${loadUnit(unit)} over the limit. Move heavy items to ${bag.type === 'handlebar' ? 'the frame bag' : 'another bag'}.`
              : `These items take up ${vol(stats.effectiveVolume)} of space but the bag only fits ${vol(bag.volume)}. Rigid and cylindrical items leave gaps — try swapping for softer gear or move something out.`}
        </div>
      )}
      {isNearLimit && (
        <div className="bg-warning/10 rounded-lg px-3 py-2 text-small text-warning">
          Getting full — leave room for snacks along the way.
        </div>
      )}

      <div className="flex flex-wrap gap-1 min-h-[24px]">
        {items.length === 0 ? (
          <span className="text-small text-base-content/50 italic">Empty</span>
        ) : (
          items.map(si => (
            <span key={si.itemId} className="badge badge-sm badge-soft badge-primary">
              {catalog.get(si.itemId)?.name ?? si.itemId}
              {si.qty > 1 && <span className="opacity-70 ml-1">×{si.qty}</span>}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
