import { describe, expect, it } from 'vitest'
import { mapCategory, parseCSV, parseCSVRows, rowsToState, toCSV } from '../csv'
import { buildCatalog } from '../catalog'
import type { WizardState } from '../../types'

// A real LighterPack export: six columns, free-text categories, ounces.
const LIGHTERPACK_CSV = `Item Name,Category,desc,qty,weight,unit,price
Rain Jacket,Worn Clothes,Shell,1,8.5,oz,120
Sleeping Bag,Sleep System,10C comfort,1,1.5,lb,300
Spare Tube,Bike Repair,,2,105,g,8
Trail Snacks,Consumables,,3,1.2,oz,4`

describe('parseCSVRows', () => {
  it('handles quoted cells, doubled quotes and CRLF', () => {
    const rows = parseCSVRows('a,"b,c",d\r\n"say ""hi""",2,3\r\n')
    expect(rows).toEqual([
      ['a', 'b,c', 'd'],
      ['say "hi"', '2', '3'],
    ])
  })
})

describe('parseCSV — LighterPack compatibility', () => {
  it('imports a real LighterPack export', () => {
    const { rows, skipped } = parseCSV(LIGHTERPACK_CSV)
    expect(rows).toHaveLength(4)
    expect(skipped).toBe(0)
  })

  it('converts every unit it accepts into grams', () => {
    const { rows } = parseCSV(LIGHTERPACK_CSV)
    expect(rows[0].weight).toBe(241)  // 8.5 oz
    expect(rows[1].weight).toBe(680)  // 1.5 lb
    expect(rows[2].weight).toBe(105)  // already grams
  })

  it('keeps quantity per row rather than folding it into the weight', () => {
    const { rows } = parseCSV(LIGHTERPACK_CSV)
    expect(rows[2].qty).toBe(2)
    expect(rows[2].weight).toBe(105) // per unit
  })

  it('leaves LighterPack rows without a volume', () => {
    const { rows } = parseCSV(LIGHTERPACK_CSV)
    expect(rows.every(r => r.volume === 0)).toBe(true)
  })

  it('reports unreadable lines instead of swallowing them', () => {
    const { rows, skipped } = parseCSV(
      'Item Name,Category,desc,qty,weight,unit\nGood,Tech,,1,50,g\nBad,Tech,,x,50,g\nAlso bad,Tech,,1,50,furlongs'
    )
    expect(rows).toHaveLength(1)
    expect(skipped).toBe(2)
  })

  it('never throws on malformed input', () => {
    expect(() => parseCSV('')).not.toThrow()
    expect(() => parseCSV('just,some,words')).not.toThrow()
    expect(() => parseCSV('"unterminated quote,1,2')).not.toThrow()
    expect(parseCSV('').rows).toEqual([])
  })
})

describe('mapCategory', () => {
  it('maps LighterPack free text onto our categories', () => {
    expect(mapCategory('Worn Clothes')).toBe('clothes')
    expect(mapCategory('Sleep System')).toBe('sleep')
    expect(mapCategory('Bike Repair')).toBe('repair')
    expect(mapCategory('Consumables')).toBe('food')
    expect(mapCategory('Electronics')).toBe('tech')
  })

  it('falls back to "other" rather than guessing wrong', () => {
    expect(mapCategory('Miscellaneous whatnot')).toBe('other')
    expect(mapCategory('')).toBe('other')
  })
})

describe('toCSV → parseCSV round trip', () => {
  function stateWith(customItems: WizardState['customItems'], selectedItems: WizardState['selectedItems']): WizardState {
    return {
      step: 6, bike: null, event: null,
      bags: [{ id: 'frame1', type: 'frame', position: 'center_low', volume: 6, maxWeight: 4, items: [] }],
      selectedItems, customItems, unit: 'metric',
    }
  }

  it('survives a full round trip with quantities and flags intact', () => {
    const imported = rowsToState(parseCSV(LIGHTERPACK_CSV).rows)
    imported.selectedItems[0].worn = true
    imported.selectedItems[3].consumable = true
    imported.selectedItems[2].bagId = 'frame1'

    const original = stateWith(imported.customItems, imported.selectedItems)
    const reparsed = parseCSV(toCSV(original, buildCatalog(original.customItems)))

    expect(reparsed.skipped).toBe(0)
    expect(reparsed.rows.map(r => r.name)).toEqual(['Rain Jacket', 'Sleeping Bag', 'Spare Tube', 'Trail Snacks'])
    expect(reparsed.rows.map(r => r.weight)).toEqual([241, 680, 105, 34])
    expect(reparsed.rows.map(r => r.qty)).toEqual([1, 1, 2, 3])
    expect(reparsed.rows[0].worn).toBe(true)
    expect(reparsed.rows[3].consumable).toBe(true)
  })

  it('quotes names containing commas so the columns stay aligned', () => {
    const { customItems, selectedItems } = rowsToState([{
      name: 'Tools, spares and bits',
      category: 'repair', sourceCategory: 'Repair', description: '',
      qty: 1, weight: 300, volume: 0.2, worn: false, consumable: false,
    }])
    const csv = toCSV(stateWith(customItems, selectedItems), buildCatalog(customItems))

    expect(csv).toContain('"Tools, spares and bits"')
    expect(parseCSV(csv).rows[0].name).toBe('Tools, spares and bits')
  })

  it('carries the to-buy flag through export and re-import', () => {
    const imported = rowsToState(parseCSV(LIGHTERPACK_CSV).rows)
    imported.selectedItems[1].toBuy = true

    const original = stateWith(imported.customItems, imported.selectedItems)
    const reparsed = parseCSV(toCSV(original, buildCatalog(original.customItems)))

    expect(reparsed.rows.map(r => r.toBuy ?? false)).toEqual([false, true, false, false])
    const { selectedItems } = rowsToState(reparsed.rows)
    expect(selectedItems[1].toBuy).toBe(true)
    expect(selectedItems[0].toBuy).toBeUndefined()
  })

  it('carries the volume our export adds but LighterPack has no column for', () => {
    const { customItems, selectedItems } = rowsToState([{
      name: 'Tent', category: 'sleep', sourceCategory: 'Sleep', description: '',
      qty: 1, weight: 1200, volume: 3, worn: false, consumable: false,
    }])
    const csv = toCSV(stateWith(customItems, selectedItems), buildCatalog(customItems))

    expect(parseCSV(csv).rows[0].volume).toBe(3)
  })
})
