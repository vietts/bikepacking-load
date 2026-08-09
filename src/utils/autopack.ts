import type { WizardState, SelectedItem, Bag } from '../types'
import { packingFactorFor, type Catalog } from './catalog'

/**
 * Filling twenty <select> dropdowns by hand is the single worst moment in the wizard.
 * Every catalog item already carries a `preferredBag` (heavy and dense → frame bag,
 * light and bulky → handlebar) straight from the load-distribution rules in
 * KNOWLEDGE.md §7, so we can do the first pass for the rider.
 *
 * Only unassigned, non-worn gear is touched: anything the user placed by hand stays
 * exactly where they put it, which also makes a second run a no-op.
 */

interface Headroom {
  bag: Bag
  weight: number // grams still available
  volume: number // liters still available (effective)
}

function buildHeadroom(state: WizardState, catalog: Catalog): Map<string, Headroom> {
  const headroom = new Map<string, Headroom>()
  for (const bag of state.bags) {
    headroom.set(bag.id, {
      bag,
      weight: bag.maxWeight * 1000,
      volume: bag.volume,
    })
  }

  // Subtract what's already in there.
  for (const item of state.selectedItems) {
    if (item.worn || !item.bagId) continue
    const room = headroom.get(item.bagId)
    if (!room) continue
    const qty = Math.max(1, item.qty || 1)
    room.weight -= item.weight * qty
    room.volume -= item.volume * qty * packingFactorFor(catalog.get(item.itemId))
  }

  return headroom
}

function fits(room: Headroom, grams: number, liters: number): boolean {
  return room.weight >= grams && room.volume >= liters
}

/** The bag with the most room left, so nothing gets crammed into an already-full pack. */
function roomiest(rooms: Headroom[]): Headroom | undefined {
  return rooms.reduce<Headroom | undefined>((best, room) => {
    if (!best) return room
    return room.volume > best.volume ? room : best
  }, undefined)
}

export function autoAssign(state: WizardState, catalog: Catalog): SelectedItem[] {
  if (state.bags.length === 0) return state.selectedItems

  const headroom = buildHeadroom(state, catalog)
  const rooms = [...headroom.values()]

  // Bulkiest first: the big soft things need a specific home, small dense
  // ones squeeze in anywhere that's left.
  const pending = state.selectedItems
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.worn && !item.bagId)
    .sort((a, b) => b.item.volume * b.item.qty - a.item.volume * a.item.qty)

  const assignments = new Map<number, string>()

  for (const { item, index } of pending) {
    const spec = catalog.get(item.itemId)
    const qty = Math.max(1, item.qty || 1)
    const grams = item.weight * qty
    const liters = item.volume * qty * packingFactorFor(spec)

    const preferred = spec?.preferredBag
    const candidate =
      (preferred ? rooms.find(r => r.bag.type === preferred && fits(r, grams, liters)) : undefined)
      ?? roomiest(rooms.filter(r => fits(r, grams, liters)))
      // Nothing has room — put it where its type belongs anyway and let the
      // overflow warnings tell the story, rather than leaving it unassigned.
      ?? (preferred ? rooms.find(r => r.bag.type === preferred) : undefined)
      ?? roomiest(rooms)

    if (!candidate) continue

    candidate.weight -= grams
    candidate.volume -= liters
    assignments.set(index, candidate.bag.id)
  }

  if (assignments.size === 0) return state.selectedItems

  return state.selectedItems.map((item, index) => {
    const bagId = assignments.get(index)
    return bagId ? { ...item, bagId } : item
  })
}

/** How many items an auto-pack run would place — used to hide the button when it'd do nothing. */
export function countUnassigned(state: WizardState): number {
  return state.selectedItems.filter(i => !i.worn && !i.bagId).length
}
