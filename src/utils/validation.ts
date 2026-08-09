import type { WizardState, ValidationMessage, UnitSystem } from '../types'
import type { PackingStats } from '../hooks/usePacking'
import { formatItemWeight, formatLoad, formatVolume } from './units'

/**
 * The weight limits in KNOWLEDGE.md §5 are about what the *bike* carries.
 * The rain jacket you're wearing and the bars you'll eat before lunch shouldn't
 * push you over the limit, so every threshold here reads `onBikeWeight`,
 * never the grand total.
 */
export function validate(state: WizardState, packing: PackingStats, unit: UnitSystem = 'metric'): ValidationMessage[] {
  const messages: ValidationMessage[] = []
  if (!state.event) return messages

  const catalog = packing.catalog
  const onBikeKg = packing.onBikeWeightKg
  const load = (grams: number) => formatLoad(grams, unit)
  const onBike = load(packing.onBikeWeight)
  const wornNote = packing.wornWeight >= 100
    ? ` (plus ${load(packing.wornWeight)} you're wearing, which the bike doesn't carry)`
    : ''

  // Total weight over max
  if (onBikeKg > state.event.maxAcceptableWeight) {
    messages.push({
      severity: 'error',
      title: 'Too much weight',
      message: `Your bike is carrying ${onBike}${wornNote} — for ${state.event.name} we recommend staying under ${load(state.event.maxAcceptableWeight * 1000)}. Less is more on the road!`,
    })
  } else if (onBikeKg > state.event.recommendedWeight.max) {
    messages.push({
      severity: 'warning',
      title: 'Above target weight',
      message: `Your bike is carrying ${onBike}${wornNote} — the sweet spot for ${state.event.name} is ${load(state.event.recommendedWeight.min * 1000)}–${load(state.event.recommendedWeight.max * 1000)}. You might want to trim a few things.`,
    })
  }

  // Per-bag checks
  for (const bag of state.bags) {
    const stats = packing.bagStats[bag.id]
    if (!stats) continue

    const bagWeightKg = stats.totalWeight / 1000
    const bagLoad = load(stats.totalWeight)

    // Handlebar too heavy
    if (bag.type === 'handlebar' && bagWeightKg > 5) {
      messages.push({
        severity: 'warning',
        title: 'Heavy handlebar bag',
        message: `Your handlebar bag is ${bagLoad} — past ${load(4500)} your steering gets sketchy. Try moving heavy items to the frame bag.`,
        bagId: bag.id,
      })
    }

    // Saddle too heavy
    if (bag.type === 'saddle' && bagWeightKg > 5) {
      messages.push({
        severity: 'warning',
        title: 'Heavy saddle bag',
        message: `Your saddle bag is getting heavy (${bagLoad}). It'll start swaying side to side. Move heavier items to the frame.`,
        bagId: bag.id,
      })
    }

    // Volume overflow (using effective volume which accounts for item shapes)
    if (bag.volume > 0 && stats.effectiveVolume / bag.volume > 0.9) {
      messages.push({
        severity: 'warning',
        title: `${bag.type.replace('_', ' ')} almost full`,
        message: `Your items take up ${Math.round((stats.effectiveVolume / bag.volume) * 100)}% of the ${bag.type.replace('_', ' ')} space (${formatVolume(stats.effectiveVolume, unit)} of ${formatVolume(bag.volume, unit)}). Solid items don't pack like liquid — leave a bit of room for snacks and supplies you'll pick up along the way.`,
        bagId: bag.id,
      })
    }
  }

  // Weight distribution (rear-heavy check)
  if (packing.distribution.rear > 60) {
    messages.push({
      severity: 'warning',
      title: 'Rear-heavy load',
      message: `Your load is ${Math.round(packing.distribution.rear)}% rear-heavy. This makes the front wheel lighter and less predictable. Spread some weight forward.`,
    })
  }

  // Missing essentials
  const selectedIds = new Set(state.selectedItems.map(i => i.itemId))
  for (const essentialId of state.event.essentialItems) {
    if (!selectedIds.has(essentialId)) {
      const item = catalog.get(essentialId)
      if (item) {
        messages.push({
          severity: 'error',
          title: `Missing: ${item.name}`,
          message: `Don't forget your ${item.name.toLowerCase()}! It's one of those things you won't miss until you really, really need it.`,
          itemId: essentialId,
        })
      }
    }
  }

  // Unnecessary items
  for (const selectedItem of state.selectedItems) {
    if (state.event.unnecessaryItems.includes(selectedItem.itemId)) {
      const item = catalog.get(selectedItem.itemId)
      if (item) {
        messages.push({
          severity: 'info',
          title: `Consider leaving: ${item.name}`,
          message: `You packed a ${item.name.toLowerCase()} — for ${state.event.name} you probably won't need it. But hey, it's your call!`,
          itemId: selectedItem.itemId,
        })
      }
    }
  }

  // Placement suggestions (heavy items in handlebar instead of frame)
  const frameBag = state.bags.find(b => b.type === 'frame')
  if (frameBag) {
    for (const selectedItem of state.selectedItems) {
      if (!selectedItem.bagId) continue
      const bag = state.bags.find(b => b.id === selectedItem.bagId)
      if (!bag || bag.type !== 'handlebar') continue

      const item = catalog.get(selectedItem.itemId)
      const lineWeight = selectedItem.weight * Math.max(1, selectedItem.qty || 1)
      if (item && item.rigidity === 'rigid' && lineWeight > 200) {
        messages.push({
          severity: 'info',
          title: `Better placement for ${item.name}`,
          message: `Tip: your ${item.name.toLowerCase()} (${formatItemWeight(lineWeight, unit)}) would ride better in the frame bag — it keeps the weight low and centered.`,
          itemId: selectedItem.itemId,
          bagId: selectedItem.bagId,
        })
      }
    }
  }

  // Optimal setup 🤙
  const hasErrors = messages.some(m => m.severity === 'error')
  const hasWarnings = messages.some(m => m.severity === 'warning')
  if (!hasErrors && !hasWarnings && state.selectedItems.length > 0 && packing.isInRecommendedRange) {
    messages.push({
      severity: 'success',
      title: 'Looking great!',
      message: `${onBike} on the bike for ${state.event.name} is a solid setup. You've got everything you need and nothing you don't. 🤙`,
    })
  }

  return messages
}
