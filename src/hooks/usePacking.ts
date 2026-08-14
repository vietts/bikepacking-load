import { useMemo } from 'react'
import type { WizardState, BagPosition, BagType, Bag } from '../types'
import itemsData from '../data/items.json'
import type { ItemSpec } from '../types'

const items = itemsData as ItemSpec[]

/**
 * Packing efficiency factors based on shape + rigidity.
 * Represents the real-world volume an item occupies inside a bag
 * relative to its nominal volume.
 *
 * - Rigid rectangular (1.0): stacks perfectly, no wasted space
 * - Rigid cylindrical (1.3): cylinders leave 30% gaps between them
 * - Soft rectangular (0.85): compresses slightly, fills small gaps
 * - Soft cylindrical (0.75): rolls/deforms to fill gaps efficiently
 */
const PACKING_FACTOR: Record<string, Record<string, number>> = {
  rigid:  { rectangular: 1.0,  cylindrical: 1.3 },
  soft:   { rectangular: 0.85, cylindrical: 0.75 },
}

function getEffectiveVolume(itemId: string, nominalVolume: number): { effective: number; factor: number } {
  const spec = items.find(i => i.id === itemId)
  if (!spec) return { effective: nominalVolume, factor: 1.0 }

  const factor = PACKING_FACTOR[spec.rigidity]?.[spec.shape] ?? 1.0
  return { effective: +(nominalVolume * factor).toFixed(3), factor }
}

export interface BagStats {
  totalWeight: number       // grams
  totalVolume: number       // liters (nominal)
  effectiveVolume: number   // liters (adjusted for packing efficiency)
  weightPercent: number
  volumePercent: number     // based on effective volume
  overWeight: boolean
  overVolume: boolean       // based on effective volume
}

interface PackingStats {
  totalWeight: number // grams
  totalWeightKg: number
  bagStats: Record<string, BagStats>
  unassignedWeight: number // grams
  unassignedVolume: number
  distribution: { front: number; center: number; rear: number }
  isOverMaxWeight: boolean
  isInRecommendedRange: boolean
}

const positionZone: Record<BagPosition, 'front' | 'center' | 'rear'> = {
  front_high: 'front',
  front_low: 'front',
  center_low: 'center',
  top: 'center',
  rear_mid: 'rear',
}

export function usePacking(state: WizardState): PackingStats {
  return useMemo(() => {
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
    let unassignedWeight = 0
    let unassignedVolume = 0

    for (const selectedItem of state.selectedItems) {
      totalWeight += selectedItem.weight
      const { effective } = getEffectiveVolume(selectedItem.itemId, selectedItem.volume)

      if (selectedItem.bagId && bagStats[selectedItem.bagId]) {
        bagStats[selectedItem.bagId].totalWeight += selectedItem.weight
        bagStats[selectedItem.bagId].totalVolume += selectedItem.volume
        bagStats[selectedItem.bagId].effectiveVolume += effective
      } else {
        unassignedWeight += selectedItem.weight
        unassignedVolume += selectedItem.volume
      }
    }

    // Percentages and overflows use effective volume
    for (const bag of state.bags) {
      const stats = bagStats[bag.id]
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

    const assignedWeight = totalWeight - unassignedWeight
    const distribution = {
      front: assignedWeight > 0 ? (zoneWeight.front / assignedWeight) * 100 : 0,
      center: assignedWeight > 0 ? (zoneWeight.center / assignedWeight) * 100 : 0,
      rear: assignedWeight > 0 ? (zoneWeight.rear / assignedWeight) * 100 : 0,
    }

    const totalWeightKg = totalWeight / 1000
    const isOverMaxWeight = state.event ? totalWeightKg > state.event.maxAcceptableWeight : false
    const isInRecommendedRange = state.event
      ? totalWeightKg >= state.event.recommendedWeight.min && totalWeightKg <= state.event.recommendedWeight.max
      : true

    return {
      totalWeight,
      totalWeightKg,
      bagStats,
      unassignedWeight,
      unassignedVolume,
      distribution,
      isOverMaxWeight,
      isInRecommendedRange,
    }
  }, [state.bags, state.selectedItems, state.event])
}

export function getItemSpec(itemId: string): ItemSpec | undefined {
  return items.find(i => i.id === itemId)
}

export function getItemPackingFactor(itemId: string): number {
  const spec = items.find(i => i.id === itemId)
  if (!spec) return 1.0
  return PACKING_FACTOR[spec.rigidity]?.[spec.shape] ?? 1.0
}

/**
 * Fallback opening diameter (cm) per bag type, for bags without a measured
 * openingDiameter. null = opening not girth-constrained (open platform).
 */
const DEFAULT_OPENING_DIAMETER: Record<BagType, number | null> = {
  handlebar: 15,
  saddle: 14,
  fork: 14,
  frame: 6,
  top_tube: 5,
  rear_rack: null,
}

export function getOpeningDiameter(bag: Pick<Bag, 'type' | 'openingDiameter'>): number | null {
  return bag.openingDiameter ?? DEFAULT_OPENING_DIAMETER[bag.type]
}

/**
 * Girth gate: an item physically passes through the bag opening only if its
 * compressed diameter fits. Per-item boolean check, independent of the
 * remaining weight/volume budget — a bag with litres to spare can still
 * reject a sleeping bag whose roll is wider than its mouth.
 */
export function fitsGirth(itemId: string, bag: Pick<Bag, 'type' | 'openingDiameter'>): boolean {
  const packed = items.find(i => i.id === itemId)?.packedDiameter
  if (packed == null) return true
  const opening = getOpeningDiameter(bag)
  if (opening == null) return true
  return packed <= opening
}
