import type { ItemCategory, UnitSystem } from '../types'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../utils/catalog'
import { formatLoad } from '../utils/units'

interface CategoryBreakdownProps {
  /** grams per category, on-bike gear only */
  weights: Record<ItemCategory, number>
  unit: UnitSystem
}

/**
 * "Where does my weight actually go?" is a magnitude comparison across seven-ish
 * named categories, so it's a ranked bar — not the pie LighterPack uses. A pie
 * stops working past ~6 slices and forces a legend; bars stay readable, carry
 * their own labels, and print in black and white.
 *
 * One hue for every bar on purpose: length encodes the magnitude, and colouring
 * by rank would repaint categories every time the ranking shifts.
 */
export function CategoryBreakdown({ weights, unit }: CategoryBreakdownProps) {
  const rows = CATEGORY_ORDER
    .map(category => ({ category, grams: weights[category] }))
    .filter(row => row.grams > 0)
    .sort((a, b) => b.grams - a.grams)

  const total = rows.reduce((sum, row) => sum + row.grams, 0)
  if (total === 0) return null

  const heaviest = rows[0].grams

  return (
    <div className="card card-border bg-base-100 p-6 space-y-4">
      <div>
        <p className="label-caps text-base-content/60">Where your weight goes</p>
        <p className="text-small text-base-content/55 mt-1">
          {CATEGORY_LABELS[rows[0].category]} is your heaviest category at {Math.round((heaviest / total) * 100)}% of what the bike carries.
        </p>
      </div>

      <ul className="space-y-2.5">
        {rows.map(({ category, grams }) => {
          const share = (grams / total) * 100
          return (
            <li key={category} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3">
              <span className="text-small text-base-content/70 truncate">{CATEGORY_LABELS[category]}</span>
              <span className="h-2.5 bg-base-300/60 rounded-full overflow-hidden">
                <span
                  className="block h-full bg-primary rounded-full transition-[width] duration-500"
                  style={{ width: `${(grams / heaviest) * 100}%` }}
                />
              </span>
              <span className="text-small text-base-content/60 tabular-nums shrink-0 text-right">
                <span className="font-semibold text-base-content/80">{formatLoad(grams, unit)}</span>
                <span className="ml-1.5 opacity-70">{Math.round(share)}%</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
