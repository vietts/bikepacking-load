import { describe, expect, it } from 'vitest'
import { computePacking } from '../../hooks/usePacking'
import { normalizeState } from '../migrate'
import { autoAssign } from '../autopack'
import { buildCatalog } from '../catalog'
import type { Bag, BikeEvent, SelectedItem, WizardState } from '../../types'

function bag(overrides: Partial<Bag> & Pick<Bag, 'id' | 'type' | 'position'>): Bag {
  return { volume: 10, maxWeight: 5, items: [], ...overrides }
}

function item(overrides: Partial<SelectedItem> & Pick<SelectedItem, 'itemId'>): SelectedItem {
  return { bagId: null, weight: 100, volume: 0.5, qty: 1, ...overrides }
}

const event: BikeEvent = {
  id: 'test', name: 'Test Ride', type: 'road', isBAS: false, description: '',
  recommendedWeight: { min: 5, max: 8 }, maxAcceptableWeight: 12,
  essentialItems: [], unnecessaryItems: [], tips: [],
}

function state(overrides: Partial<WizardState> = {}): WizardState {
  return {
    step: 4, bike: null, event: null, bags: [], selectedItems: [],
    customItems: [], unit: 'metric', ...overrides,
  }
}

describe('computePacking — quantities', () => {
  it('multiplies weight and volume by quantity', () => {
    const packing = computePacking(state({
      // spare_tubes is soft + cylindrical in the catalog
      selectedItems: [item({ itemId: 'spare_tubes', weight: 100, volume: 0.1, qty: 3 })],
    }))

    expect(packing.totalWeight).toBe(300)
    expect(packing.onBikeWeight).toBe(300)
  })

  it('counts a missing qty as one', () => {
    const raw = { itemId: 'spare_tubes', bagId: null, weight: 100, volume: 0.1 }
    const normalized = normalizeState({ selectedItems: [raw] })!
    expect(normalized.selectedItems[0].qty).toBe(1)
    expect(computePacking(state({ selectedItems: normalized.selectedItems })).totalWeight).toBe(100)
  })
})

describe('computePacking — worn, consumable and the weight hierarchy', () => {
  it('keeps worn gear off the bike', () => {
    const packing = computePacking(state({
      selectedItems: [
        item({ itemId: 'rain_jacket', weight: 200, worn: true }),
        item({ itemId: 'spare_tubes', weight: 100 }),
      ],
    }))

    expect(packing.totalWeight).toBe(300)
    expect(packing.wornWeight).toBe(200)
    expect(packing.onBikeWeight).toBe(100)
  })

  it('holds onBike + worn === total and base + consumable === onBike', () => {
    const packing = computePacking(state({
      selectedItems: [
        item({ itemId: 'rain_jacket', weight: 250, worn: true }),
        item({ itemId: 'snacks', weight: 400, consumable: true, qty: 2 }),
        item({ itemId: 'multitool', weight: 200 }),
      ],
    }))

    expect(packing.onBikeWeight + packing.wornWeight).toBe(packing.totalWeight)
    expect(packing.baseWeight + packing.consumableWeight).toBe(packing.onBikeWeight)
    expect(packing.consumableWeight).toBe(800)
  })

  it('excludes worn gear from bag totals and from the balance', () => {
    const rear = bag({ id: 'saddle1', type: 'saddle', position: 'rear_mid' })
    const packing = computePacking(state({
      bags: [rear],
      // A worn item pointing at a bag can only come from a hand-crafted payload,
      // but it must never inflate that bag or tip the distribution.
      selectedItems: [
        item({ itemId: 'rain_jacket', weight: 5000, worn: true, bagId: 'saddle1' }),
        item({ itemId: 'multitool', weight: 200, bagId: 'saddle1' }),
      ],
    }))

    expect(packing.bagStats.saddle1.totalWeight).toBe(200)
    expect(packing.bagStats.saddle1.overWeight).toBe(false)
    expect(packing.distribution.rear).toBe(100)
  })

  it('measures the event limits against the on-bike load, not the total', () => {
    const packing = computePacking(state({
      event,
      selectedItems: [
        item({ itemId: 'multitool', weight: 6000 }),
        item({ itemId: 'rain_jacket', weight: 8000, worn: true }),
      ],
    }))

    expect(packing.totalWeightKg).toBe(14) // over maxAcceptableWeight of 12…
    expect(packing.onBikeWeightKg).toBe(6) // …but the bike only carries 6
    expect(packing.isOverMaxWeight).toBe(false)
    expect(packing.isInRecommendedRange).toBe(true)
  })
})

describe('normalizeState — old setups keep their numbers', () => {
  it('reproduces a pre-qty payload exactly', () => {
    const legacy = {
      step: 5,
      bike: { type: 'gravel', size: 'M', weight: 9, frameBagMaxVolume: 6 },
      event,
      bags: [{ id: 'frame1', type: 'frame', position: 'center_low', volume: 6, maxWeight: 4, items: [] }],
      selectedItems: [
        { itemId: 'multitool', bagId: 'frame1', weight: 200, volume: 0.1 },
        { itemId: 'rain_jacket', bagId: null, weight: 225, volume: 0.75 },
      ],
    }

    const restored = normalizeState(legacy)!
    const packing = computePacking(restored)

    expect(packing.totalWeight).toBe(425)
    expect(packing.wornWeight).toBe(0)
    expect(packing.onBikeWeight).toBe(packing.totalWeight)
    expect(packing.bagStats.frame1.totalWeight).toBe(200)
    expect(restored.customItems).toEqual([])
    expect(restored.unit).toBe('metric')
  })

  it('rejects junk without throwing', () => {
    expect(normalizeState(null)).toBeNull()
    expect(normalizeState('nope')).toBeNull()
    const salvaged = normalizeState({ selectedItems: [null, 42, { itemId: 'ok', weight: 10 }] })!
    expect(salvaged.selectedItems).toHaveLength(1)
  })

  it('unassigns items pointing at a bag that no longer exists', () => {
    const restored = normalizeState({
      bags: [{ id: 'frame1', type: 'frame', position: 'center_low', volume: 6, maxWeight: 4, items: [] }],
      selectedItems: [{ itemId: 'multitool', bagId: 'deleted_bag', weight: 200, volume: 0.1 }],
    })!
    expect(restored.selectedItems[0].bagId).toBeNull()
  })

  it('strips the bag from worn gear', () => {
    const restored = normalizeState({
      bags: [{ id: 'frame1', type: 'frame', position: 'center_low', volume: 6, maxWeight: 4, items: [] }],
      selectedItems: [{ itemId: 'rain_jacket', bagId: 'frame1', weight: 200, volume: 0.5, worn: true }],
    })!
    expect(restored.selectedItems[0].bagId).toBeNull()
  })
})

describe('autoAssign', () => {
  const bags = [
    bag({ id: 'frame1', type: 'frame', position: 'center_low', volume: 6, maxWeight: 4 }),
    bag({ id: 'bar1', type: 'handlebar', position: 'front_high', volume: 12, maxWeight: 4 }),
  ]

  it('honours preferredBag', () => {
    // multitool prefers the frame bag; sleeping_bag prefers the handlebar.
    const base = state({ bags, selectedItems: [item({ itemId: 'multitool', weight: 200, volume: 0.1 })] })
    const [assigned] = autoAssign(base, buildCatalog([]))
    expect(assigned.bagId).toBe('frame1')
  })

  it('leaves hand-placed gear where it is, and runs idempotently', () => {
    const base = state({
      bags,
      selectedItems: [
        item({ itemId: 'multitool', weight: 200, volume: 0.1, bagId: 'bar1' }),
        item({ itemId: 'rain_jacket', weight: 200, volume: 0.75 }),
      ],
    })

    const first = autoAssign(base, buildCatalog([]))
    expect(first[0].bagId).toBe('bar1') // untouched

    const second = autoAssign({ ...base, selectedItems: first }, buildCatalog([]))
    expect(second.map(i => i.bagId)).toEqual(first.map(i => i.bagId))
  })

  it('respects bag capacity by falling back to a roomier bag', () => {
    const tinyFrame = bag({ id: 'frame1', type: 'frame', position: 'center_low', volume: 0.05, maxWeight: 0.1 })
    const roomyBar = bag({ id: 'bar1', type: 'handlebar', position: 'front_high', volume: 12, maxWeight: 4 })
    const base = state({
      bags: [tinyFrame, roomyBar],
      selectedItems: [item({ itemId: 'multitool', weight: 200, volume: 0.1 })],
    })

    expect(autoAssign(base, buildCatalog([]))[0].bagId).toBe('bar1')
  })

  it('does nothing when there are no bags', () => {
    const base = state({ selectedItems: [item({ itemId: 'multitool' })] })
    expect(autoAssign(base, buildCatalog([]))).toBe(base.selectedItems)
  })
})
