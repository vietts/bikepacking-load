import { describe, expect, it } from 'vitest'
import { normalizeState } from '../migrate'

describe('normalizeState — toBuy flag', () => {
  it('keeps toBuy from a saved session and defaults it off for old payloads', () => {
    const state = normalizeState({
      bike: { type: 'gravel', size: 'M', weight: 10, frameBagMaxVolume: 6 },
      selectedItems: [
        { itemId: 'pump', bagId: null, weight: 100, volume: 0.2, qty: 1, toBuy: true },
        { itemId: 'tent', bagId: null, weight: 1200, volume: 3, qty: 1 },
      ],
    })
    expect(state?.selectedItems[0].toBuy).toBe(true)
    expect(state?.selectedItems[1].toBuy).toBe(false)
  })

  it('ignores a crafted non-boolean toBuy', () => {
    const state = normalizeState({
      selectedItems: [{ itemId: 'pump', weight: 100, volume: 0.2, qty: 1, toBuy: 'yes' }],
    })
    expect(state?.selectedItems[0].toBuy).toBe(false)
  })
})
