import type { WizardState, SelectedItem, ItemSpec, ItemCategory, ItemPriority, Bag, UnitSystem } from '../types'

const ITEM_CATEGORIES: ItemCategory[] = ['clothes', 'sleep', 'tech', 'repair', 'hygiene', 'food', 'docs', 'other']
const ITEM_PRIORITIES: ItemPriority[] = ['essential', 'high', 'medium', 'low', 'conditional']

/**
 * Setups saved before quantities and worn/consumable existed are still out there —
 * in localStorage and in every shared `#config=` link. Both entry points funnel
 * through here so an old payload keeps producing exactly the numbers it used to:
 * qty defaults to 1, worn/consumable to false, so onBikeWeight === totalWeight.
 *
 * The input is untrusted (anyone can craft a share URL), so every field is checked
 * rather than assumed.
 */

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeSelectedItem(raw: unknown): SelectedItem | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<SelectedItem>
  if (typeof item.itemId !== 'string' || !item.itemId) return null

  return {
    itemId: item.itemId,
    bagId: typeof item.bagId === 'string' ? item.bagId : null,
    weight: Math.max(0, num(item.weight, 0)),
    volume: Math.max(0, num(item.volume, 0)),
    // Pre-qty payloads meant "one of these".
    qty: Math.max(1, Math.round(num(item.qty, 1))),
    worn: item.worn === true,
    consumable: item.consumable === true,
    auto: item.auto === true,
  }
}

function normalizeCustomItem(raw: unknown): ItemSpec | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<ItemSpec>
  if (typeof item.id !== 'string' || !item.id) return null
  if (typeof item.name !== 'string' || !item.name) return null

  const weightMin = Math.max(0, num(item.weight?.min, 0))
  const weightMax = Math.max(weightMin, num(item.weight?.max, weightMin))
  const volumeMin = Math.max(0, num(item.volume?.min, 0))
  const volumeMax = Math.max(volumeMin, num(item.volume?.max, volumeMin))

  return {
    id: item.id,
    name: item.name,
    category: ITEM_CATEGORIES.includes(item.category as ItemCategory) ? (item.category as ItemCategory) : 'other',
    weight: { min: weightMin, max: weightMax },
    volume: { min: volumeMin, max: volumeMax },
    priority: ITEM_PRIORITIES.includes(item.priority as ItemPriority) ? (item.priority as ItemPriority) : 'medium',
    shape: item.shape === 'cylindrical' ? 'cylindrical' : 'rectangular',
    rigidity: item.rigidity === 'rigid' ? 'rigid' : 'soft',
    preferredBag: item.preferredBag,
    note: typeof item.note === 'string' ? item.note : undefined,
  }
}

const TOTAL_STEPS = 7

export function normalizeState(raw: unknown): WizardState | null {
  if (!raw || typeof raw !== 'object') return null
  const state = raw as Partial<WizardState>

  const bags: Bag[] = Array.isArray(state.bags)
    ? state.bags.filter((b): b is Bag => !!b && typeof b === 'object' && typeof b.id === 'string')
    : []

  const selectedItems = Array.isArray(state.selectedItems)
    ? state.selectedItems.map(normalizeSelectedItem).filter((i): i is SelectedItem => i !== null)
    : []

  const customItems = Array.isArray(state.customItems)
    ? state.customItems.map(normalizeCustomItem).filter((i): i is ItemSpec => i !== null)
    : []

  // An item pointing at a bag that no longer exists would silently vanish from every
  // bag panel while still counting toward the total — send it back to "unassigned".
  const bagIds = new Set(bags.map(b => b.id))
  for (const item of selectedItems) {
    if (item.bagId && !bagIds.has(item.bagId)) item.bagId = null
    // Worn gear is on your body, never in a bag.
    if (item.worn) item.bagId = null
  }

  const unit: UnitSystem = state.unit === 'imperial' ? 'imperial' : 'metric'

  return {
    step: Math.max(1, Math.min(TOTAL_STEPS, Math.round(num(state.step, 1)))),
    bike: state.bike ?? null,
    event: state.event ?? null,
    bags,
    selectedItems,
    customItems,
    unit,
  }
}
