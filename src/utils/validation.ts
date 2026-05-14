import type { WizardState, ValidationMessage } from '../types'
import itemsData from '../data/items.json'
import type { ItemSpec } from '../types'

const items = itemsData as ItemSpec[]

import type { BagStats } from '../hooks/usePacking'

export function validate(state: WizardState, bagStats: Record<string, BagStats>): ValidationMessage[] {
  const messages: ValidationMessage[] = []
  if (!state.event) return messages

  const totalWeightKg = state.selectedItems.reduce((s, i) => s + i.weight, 0) / 1000

  // Total weight over max
  if (totalWeightKg > state.event.maxAcceptableWeight) {
    messages.push({
      severity: 'error',
      title: 'A bit too much',
      message: `${totalWeightKg.toFixed(1)}kg is over what we'd carry on ${state.event.name}. Look for things you can leave behind — the weight you don't bring is the weight you don't feel.`,
    })
  } else if (totalWeightKg > state.event.recommendedWeight.max) {
    messages.push({
      severity: 'warning',
      title: 'A little heavy',
      message: `You're at ${totalWeightKg.toFixed(1)}kg. For ${state.event.name}, riders are usually happiest between ${state.event.recommendedWeight.min} and ${state.event.recommendedWeight.max}kg. Want to trim a few extras?`,
    })
  }

  // Per-bag checks
  for (const bag of state.bags) {
    const stats = bagStats[bag.id]
    if (!stats) continue

    const bagWeightKg = stats.totalWeight / 1000

    // Handlebar too heavy
    if (bag.type === 'handlebar' && bagWeightKg > 5) {
      messages.push({
        severity: 'warning',
        title: 'Handlebar feels heavy',
        message: `${bagWeightKg.toFixed(1)}kg up front is a lot — over 4-5kg the steering gets twitchy on descents. Move anything dense into the frame bag if you can.`,
        bagId: bag.id,
      })
    }

    // Saddle too heavy
    if (bag.type === 'saddle' && bagWeightKg > 5) {
      messages.push({
        severity: 'warning',
        title: 'Saddle bag is loaded up',
        message: `${bagWeightKg.toFixed(1)}kg behind the saddle tends to sway side-to-side on rough sections. Shifting the heavier stuff to the frame keeps the bike planted.`,
        bagId: bag.id,
      })
    }

    // Volume overflow (using effective volume which accounts for item shapes)
    const effectiveVol = stats.effectiveVolume ?? stats.totalVolume
    if (bag.volume > 0 && effectiveVol / bag.volume > 0.9) {
      messages.push({
        severity: 'warning',
        title: `${bag.type.replace('_', ' ')} is almost full`,
        message: `You're using about ${Math.round((effectiveVol / bag.volume) * 100)}% of the space. Leave a bit of room — you'll pick up snacks and small things along the way.`,
        bagId: bag.id,
      })
    }
  }

  // Weight distribution (rear-heavy check)
  const positionZone: Record<string, 'front' | 'center' | 'rear'> = {
    front_high: 'front', front_low: 'front',
    center_low: 'center', top: 'center',
    rear_mid: 'rear',
  }
  const zoneWeight = { front: 0, center: 0, rear: 0 }
  for (const bag of state.bags) {
    const zone = positionZone[bag.position] ?? 'center'
    zoneWeight[zone] += bagStats[bag.id]?.totalWeight ?? 0
  }
  const assignedWeight = zoneWeight.front + zoneWeight.center + zoneWeight.rear
  if (assignedWeight > 0) {
    const rearPercent = (zoneWeight.rear / assignedWeight) * 100
    if (rearPercent > 60) {
      messages.push({
        severity: 'warning',
        title: 'Most of the weight is at the back',
        message: `About ${Math.round(rearPercent)}% of your load is over the rear wheel. It makes the front feel light and a little vague — try shifting a couple of heavier items forward into the frame.`,
      })
    }
  }

  // Missing essentials
  const selectedIds = new Set(state.selectedItems.map(i => i.itemId))
  for (const essentialId of state.event.essentialItems) {
    if (!selectedIds.has(essentialId)) {
      const item = items.find(i => i.id === essentialId)
      if (item) {
        messages.push({
          severity: 'error',
          title: `You'll want: ${item.name}`,
          message: `Don't forget your ${item.name.toLowerCase()} — it's one of those things you won't miss until the moment you really need it.`,
          itemId: essentialId,
        })
      }
    }
  }

  // Unnecessary items
  for (const selectedItem of state.selectedItems) {
    if (state.event.unnecessaryItems.includes(selectedItem.itemId)) {
      const item = items.find(i => i.id === selectedItem.itemId)
      if (item) {
        messages.push({
          severity: 'info',
          title: `Maybe leave the ${item.name.toLowerCase()}?`,
          message: `On ${state.event.name} you can probably do without it. Up to you — but every gram you skip is one you don't carry up the hills.`,
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
      if (!bag || bag.type === 'frame') continue

      const item = items.find(i => i.id === selectedItem.itemId)
      if (item && item.rigidity === 'rigid' && selectedItem.weight > 200 && bag.type === 'handlebar') {
        messages.push({
          severity: 'info',
          title: `Move the ${item.name.toLowerCase()}?`,
          message: `Heavy, solid items like this ride better in the frame bag — low and centered. The bike feels steadier, especially on descents.`,
          itemId: selectedItem.itemId,
          bagId: selectedItem.bagId,
        })
      }
    }
  }

  // Optimal setup 🤙
  const hasErrors = messages.some(m => m.severity === 'error')
  const hasWarnings = messages.some(m => m.severity === 'warning')
  if (!hasErrors && !hasWarnings && state.selectedItems.length > 0 &&
    totalWeightKg >= state.event.recommendedWeight.min &&
    totalWeightKg <= state.event.recommendedWeight.max) {
    messages.push({
      severity: 'success',
      title: 'This is a solid setup',
      message: `${totalWeightKg.toFixed(1)}kg for ${state.event.name} is exactly where you want to be — everything you need, nothing you don't. Have a great ride.`,
    })
  }

  return messages
}
