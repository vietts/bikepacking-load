import { useMemo } from 'react'
import type { WizardState, BagPosition, ItemCategory } from '../types'
import { buildCatalog, packingFactorFor, type Catalog } from '../utils/catalog'

export interface BagStats {
  totalWeight: number       // grams
  totalVolume: number       // liters (nominal)
  effectiveVolume: number   // liters (adjusted for packing efficiency)
  weightPercent: number
  volumePercent: number     // based on effective volume
  overWeight: boolean
  overVolume: boolean       // based on effective volume
}

export interface PackingStats {
  /** Everything you own for this trip, worn included. */
  totalWeight: number // grams
  totalWeightKg: number
  /** What you're wearing — it never touches the bike. */
  wornWeight: number
  /** total − worn. This is what the bike actually carries, and what event limits apply to. */
  onBikeWeight: number
  onBikeWeightKg: number
  /** Food, water, gas — on the bike now, gone by tonight. */
  consumableWeight: number
  /** onBike − consumable. The load you carry every single day. */
  baseWeight: number
  bagStats: Record<string, BagStats>
  unassignedWeight: number // grams, on-bike gear with no bag yet
  unassignedVolume: number
  distribution: { front: number; center: number; rear: number }
  categoryWeights: Record<ItemCategory, number> // grams, on-bike only
  isOverMaxWeight: boolean
  isInRecommendedRange: boolean
  catalog: Catalog
}

const positionZone: Record<BagPosition, 'front' | 'center' | 'rear'> = {
  front_high: 'front',
  front_low: 'front',
  center_low: 'center',
  top: 'center',
  rear_mid: 'rear',
}

const emptyCategoryWeights = (): Record<ItemCategory, number> => ({
  clothes: 0, sleep: 0, tech: 0, repair: 0, hygiene: 0, food: 0, docs: 0, other: 0,
})

export function computePacking(state: WizardState): PackingStats {
  const catalog = buildCatalog(state.customItems)
  const bagStats: Record<string, BagStats> = {}

  for (const bag of state.bags) {
    bagStats[bag.id] = {
      totalWeight: 0,
      totalVolume: 0,
      effectiveVolume: 0,
      weightPercent: 0,
      volumePercent: 0,
      overWeight: false,
      overVolume: false,
    }
  }

  let totalWeight = 0
  let wornWeight = 0
  let consumableWeight = 0
  let unassignedWeight = 0
  let unassignedVolume = 0
  const categoryWeights = emptyCategoryWeights()

  for (const selectedItem of state.selectedItems) {
    const spec = catalog.get(selectedItem.itemId)
    const qty = Math.max(1, selectedItem.qty || 1)
    const lineWeight = selectedItem.weight * qty
    const lineVolume = selectedItem.volume * qty

    totalWeight += lineWeight

    // Worn gear is on your body: it never enters a bag, never shifts the balance,
    // and never counts against the event's load limit.
    if (selectedItem.worn) {
      wornWeight += lineWeight
      continue
    }

    if (selectedItem.consumable) consumableWeight += lineWeight
    categoryWeights[spec?.category ?? 'other'] += lineWeight

    const effective = +(lineVolume * packingFactorFor(spec)).toFixed(3)

    if (selectedItem.bagId && bagStats[selectedItem.bagId]) {
      bagStats[selectedItem.bagId].totalWeight += lineWeight
      bagStats[selectedItem.bagId].totalVolume += lineVolume
      bagStats[selectedItem.bagId].effectiveVolume += effective
    } else {
      unassignedWeight += lineWeight
      unassignedVolume += lineVolume
    }
  }

  // Percentages and overflows use effective volume
  for (const bag of state.bags) {
    const stats = bagStats[bag.id]
    stats.effectiveVolume = +stats.effectiveVolume.toFixed(3)
    stats.weightPercent = bag.maxWeight > 0 ? (stats.totalWeight / 1000 / bag.maxWeight) * 100 : 0
    stats.volumePercent = bag.volume > 0 ? (stats.effectiveVolume / bag.volume) * 100 : 0
    stats.overWeight = stats.totalWeight / 1000 > bag.maxWeight
    stats.overVolume = stats.effectiveVolume > bag.volume
  }

  // Weight distribution
  const zoneWeight = { front: 0, center: 0, rear: 0 }
  for (const bag of state.bags) {
    const zone = positionZone[bag.position]
    zoneWeight[zone] += bagStats[bag.id].totalWeight
  }

  const onBikeWeight = totalWeight - wornWeight
  const assignedWeight = onBikeWeight - unassignedWeight
  const distribution = {
    front: assignedWeight > 0 ? (zoneWeight.front / assignedWeight) * 100 : 0,
    center: assignedWeight > 0 ? (zoneWeight.center / assignedWeight) * 100 : 0,
    rear: assignedWeight > 0 ? (zoneWeight.rear / assignedWeight) * 100 : 0,
  }

  const onBikeWeightKg = onBikeWeight / 1000
  const isOverMaxWeight = state.event ? onBikeWeightKg > state.event.maxAcceptableWeight : false
  const isInRecommendedRange = state.event
    ? onBikeWeightKg >= state.event.recommendedWeight.min && onBikeWeightKg <= state.event.recommendedWeight.max
    : true

  return {
    totalWeight,
    totalWeightKg: totalWeight / 1000,
    wornWeight,
    onBikeWeight,
    onBikeWeightKg,
    consumableWeight,
    baseWeight: onBikeWeight - consumableWeight,
    bagStats,
    unassignedWeight,
    unassignedVolume,
    distribution,
    categoryWeights,
    isOverMaxWeight,
    isInRecommendedRange,
    catalog,
  }
}

export function usePacking(state: WizardState): PackingStats {
  // The reducer hands back a fresh object on every dispatch, so keying the memo on
  // the whole state is as tight as listing its fields — and it keeps the React
  // Compiler able to optimize this hook.
  return useMemo(() => computePacking(state), [state])
}
