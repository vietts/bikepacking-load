import type { ItemCategory, ItemSpec, SelectedItem, WizardState } from '../types'
import { newCustomItemId, type Catalog } from './catalog'

/**
 * LighterPack is where most bikepackers already keep their gear list, so we speak
 * its CSV. Its own importer reads columns 0-5 and requires at least six per row,
 * which means it tolerates extra columns — so our export stays readable by
 * LighterPack while carrying the bag, volume and worn/consumable data it has no
 * concept of. Round-trip in both directions.
 */
export const CSV_HEADER = [
  'Item Name', 'Category', 'Description', 'Qty', 'Weight', 'Unit',
  'Bag', 'Volume (L)', 'Worn', 'Consumable',
] as const

/** LighterPack's own unit aliases, so a hand-edited file still imports. */
const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1, gram: 1, grams: 1,
  kg: 1000, kilogram: 1000, kilograms: 1000, kgs: 1000,
  oz: 28.3495, ounce: 28.3495, ounces: 28.3495,
  lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592,
}

/** LighterPack categories are free text, so map by keyword and fall back to 'other'. */
const CATEGORY_KEYWORDS: [RegExp, ItemCategory][] = [
  [/cloth|wear|apparel|worn|layer/i, 'clothes'],
  [/sleep|shelter|tent|bag|pad|bivy|camp/i, 'sleep'],
  [/tech|electronic|nav|gps|power|light|photo/i, 'tech'],
  [/repair|tool|spare|maintenance|bike/i, 'repair'],
  [/hygien|toilet|wash|first ?aid|medical|health/i, 'hygiene'],
  [/food|water|hydrat|cook|kitchen|nutrition|consum/i, 'food'],
  [/doc|paper|wallet|admin|id|money/i, 'docs'],
]

export function mapCategory(raw: string): ItemCategory {
  const text = raw.trim()
  if (!text) return 'other'
  for (const [pattern, category] of CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return category
  }
  return 'other'
}

function escapeCell(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCSV(state: WizardState, catalog: Catalog): string {
  const bagNames = new Map(
    state.bags.map(b => [b.id, `${b.type.replace('_', ' ')}${b.brand ? ` (${b.brand})` : ''}`])
  )

  const rows = state.selectedItems.map(item => {
    const spec = catalog.get(item.itemId)
    return [
      spec?.name ?? item.itemId,
      spec?.category ?? 'other',
      spec?.note ?? '',
      item.qty,
      Math.round(item.weight),
      'g',
      item.worn ? 'worn' : (item.bagId ? bagNames.get(item.bagId) ?? '' : ''),
      item.volume,
      item.worn ? 'yes' : '',
      item.consumable ? 'yes' : '',
    ].map(escapeCell).join(',')
  })

  return [CSV_HEADER.join(','), ...rows].join('\r\n')
}

/** RFC-4180-ish parser: handles quoted cells, doubled quotes and both line endings. */
export function parseCSVRows(input: string): string[][] {
  const rows: string[][] = [[]]
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i++) {
    const char = input[i]

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') { cell += '"'; i++ } else { inQuotes = false }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') { inQuotes = true }
    else if (char === ',') { rows[rows.length - 1].push(cell); cell = '' }
    else if (char === '\r') { /* handled by the \n that follows */ }
    else if (char === '\n') { rows[rows.length - 1].push(cell); cell = ''; rows.push([]) }
    else { cell += char }
  }

  rows[rows.length - 1].push(cell)
  // Drop the trailing empty row a final newline leaves behind.
  return rows.filter(row => row.some(c => c.trim() !== ''))
}

export interface ImportRow {
  name: string
  category: ItemCategory
  sourceCategory: string
  description: string
  qty: number
  /** grams per unit, already converted from whatever unit the file used */
  weight: number
  /** liters per unit — 0 when the source has no volume column (every LighterPack file) */
  volume: number
  worn: boolean
  consumable: boolean
}

export interface ParseResult {
  rows: ImportRow[]
  /** How many data lines we couldn't make sense of — surfaced, never swallowed. */
  skipped: number
}

export function parseCSV(text: string): ParseResult {
  const raw = parseCSVRows(text)
  const rows: ImportRow[] = []
  let skipped = 0

  for (const row of raw) {
    if (row.length < 6) { skipped++; continue }
    if (row[0].trim().toLowerCase() === 'item name') continue // header

    const name = row[0].trim()
    const qty = parseFloat(row[3])
    const weight = parseFloat(row[4])
    const factor = UNIT_TO_GRAMS[row[5].trim().toLowerCase()]

    if (!name || !Number.isFinite(qty) || qty < 1 || !Number.isFinite(weight) || weight < 0 || factor === undefined) {
      skipped++
      continue
    }

    const volume = parseFloat(row[7] ?? '')
    const flag = (value: string | undefined) => /^(yes|true|1|worn|x)$/i.test((value ?? '').trim())

    rows.push({
      name,
      category: mapCategory(row[1] ?? ''),
      sourceCategory: (row[1] ?? '').trim(),
      description: (row[2] ?? '').trim(),
      qty: Math.round(qty),
      weight: Math.round(weight * factor),
      volume: Number.isFinite(volume) && volume > 0 ? volume : 0,
      worn: flag(row[8]) || /^worn$/i.test((row[6] ?? '').trim()),
      consumable: flag(row[9]),
    })
  }

  return { rows, skipped }
}

/** Turn confirmed rows into catalog entries plus the selections that reference them. */
export function rowsToState(rows: ImportRow[]): { customItems: ItemSpec[]; selectedItems: SelectedItem[] } {
  const customItems: ItemSpec[] = []
  const selectedItems: SelectedItem[] = []

  for (const row of rows) {
    const id = newCustomItemId()
    customItems.push({
      id,
      name: row.name,
      category: row.category,
      weight: { min: row.weight, max: row.weight },
      volume: { min: row.volume, max: row.volume },
      priority: 'medium',
      shape: 'rectangular',
      rigidity: 'soft',
      note: row.description || undefined,
    })
    selectedItems.push({
      itemId: id,
      bagId: null,
      weight: row.weight,
      volume: row.volume,
      qty: row.qty,
      worn: row.worn || undefined,
      consumable: row.consumable || undefined,
    })
  }

  return { customItems, selectedItems }
}

export function downloadCSV(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
