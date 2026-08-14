import itemsData from '../data/items.json'
import type { ItemSpec, ItemCategory } from '../types'

/** The built-in gear catalog, straight from KNOWLEDGE.md. */
export const BUILTIN_ITEMS = itemsData as ItemSpec[]

export type Catalog = Map<string, ItemSpec>

/**
 * Every lookup in the app goes through here. Custom items (hand-added or CSV-imported)
 * live only in wizard state, so a component that reads items.json directly would render
 * them as raw ids — build the catalog once and pass it down instead.
 *
 * A custom item wins over a built-in one with the same id, so an imported list can
 * override a catalog entry without corrupting the shipped data.
 */
export function buildCatalog(customItems: ItemSpec[] = []): Catalog {
  const catalog: Catalog = new Map()
  for (const item of BUILTIN_ITEMS) catalog.set(item.id, item)
  for (const item of customItems) catalog.set(item.id, item)
  return catalog
}

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  clothes: 'Clothes',
  sleep: 'Sleep',
  tech: 'Tech',
  repair: 'Repair',
  hygiene: 'Hygiene',
  food: 'Food',
  docs: 'Docs',
  mounted: 'On the bike',
  other: 'Other',
}

export const CATEGORY_ORDER: ItemCategory[] = [
  'clothes', 'sleep', 'tech', 'repair', 'hygiene', 'food', 'docs', 'mounted', 'other',
]

/** Gear that rides on its own attachments — weighs on the bike, never occupies a bag. */
export function isMounted(itemId: string, catalog: Catalog): boolean {
  return catalog.get(itemId)?.category === 'mounted'
}

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
  rigid: { rectangular: 1.0, cylindrical: 1.3 },
  soft:  { rectangular: 0.85, cylindrical: 0.75 },
}

export function packingFactorFor(spec: ItemSpec | undefined): number {
  if (!spec) return 1.0
  return PACKING_FACTOR[spec.rigidity]?.[spec.shape] ?? 1.0
}

export function isCustomItem(itemId: string): boolean {
  return itemId.startsWith('custom_')
}

let customItemCounter = 0

/** Unique enough for a client-side session, and readable in a shared URL. */
export function newCustomItemId(): string {
  customItemCounter += 1
  return `custom_${Date.now().toString(36)}_${customItemCounter}`
}
