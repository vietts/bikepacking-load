import type { UnitSystem } from '../types'

/**
 * State is always stored in grams and liters — conversion happens on the way to the
 * screen and nowhere else. That keeps every calculation, every share URL and every
 * CSV export in one canonical unit, so switching to imperial can never round-trip
 * a rider's setup into slightly different numbers.
 */

const GRAMS_PER_OUNCE = 28.3495
const GRAMS_PER_POUND = 453.592
const LITERS_PER_CUBIC_INCH = 0.0163871

/**
 * A load figure: kg, or lb for imperial. Anything under 100g would round to
 * "0.0 kg" and read as nothing at all, so small loads drop to the item unit —
 * a docs pouch is "45g", never "0.0 kg".
 */
export function formatLoad(grams: number, unit: UnitSystem): string {
  if (grams > 0 && grams < 100) return formatItemWeight(grams, unit)
  if (unit === 'imperial') return `${(grams / GRAMS_PER_POUND).toFixed(1)} lb`
  return `${(grams / 1000).toFixed(1)} kg`
}

/** Same as formatLoad but without the unit, for when it's shown separately. */
export function loadValue(grams: number, unit: UnitSystem): string {
  if (unit === 'imperial') return (grams / GRAMS_PER_POUND).toFixed(1)
  return (grams / 1000).toFixed(1)
}

export function loadUnit(unit: UnitSystem): string {
  return unit === 'imperial' ? 'lb' : 'kg'
}

/** A single item's weight: grams, or ounces for imperial. */
export function formatItemWeight(grams: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const oz = grams / GRAMS_PER_OUNCE
    return `${oz < 10 ? oz.toFixed(1) : Math.round(oz)}oz`
  }
  return `${Math.round(grams)}g`
}

export function formatVolume(liters: number, unit: UnitSystem): string {
  if (unit === 'imperial') return `${Math.round(liters / LITERS_PER_CUBIC_INCH)}in³`
  return `${liters.toFixed(1)}L`
}
