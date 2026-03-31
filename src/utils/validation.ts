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
      title: 'Too much weight',
      message: `Your total load is ${totalWeightKg.toFixed(1)}kg — for ${state.event.name} we recommend staying under ${state.event.maxAcceptableWeight}kg. Less is more on the road!`,
    })
  } else if (totalWeightKg > state.event.recommendedWeight.max) {
    messages.push({
      severity: 'warning',
      title: 'Above target weight',
      message: `Your load is ${totalWeightKg.toFixed(1)}kg — the sweet spot for ${state.event.name} is ${state.event.recommendedWeight.min}-${state.event.recommendedWeight.max}kg. You might want to trim a few things.`,
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
        title: 'Heavy handlebar bag',
        message: `Your handlebar bag is ${bagWeightKg.toFixed(1)}kg — above 4-5kg your steering gets sketchy. Try moving heavy items to the frame bag.`,
        bagId: bag.id,
      })
    }

    // Saddle too heavy
    if (bag.type === 'saddle' && bagWeightKg > 5) {
      messages.push({
        severity: 'warning',
        title: 'Heavy saddle bag',
        message: `Your saddle bag is getting heavy (${bagWeightKg.toFixed(1)}kg). It'll start swaying side to side. Move heavier items to the frame.`,
        bagId: bag.id,
      })
    }

    // Volume overflow (using effective volume which accounts for item shapes)
    const effectiveVol = stats.effectiveVolume ?? stats.totalVolume
    if (bag.volume > 0 && effectiveVol / bag.volume > 0.9) {
      messages.push({
        severity: 'warning',
        title: `${bag.type.replace('_', ' ')} almost full`,
        message: `Your items take up ${Math.round((effectiveVol / bag.volume) * 100)}% of the ${bag.type.replace('_', ' ')} space. Solid items don't pack like liquid — leave a bit of room for snacks and supplies you'll pick up along the way.`,
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
        title: 'Rear-heavy load',
        message: `Your load is ${Math.round(rearPercent)}% rear-heavy. This makes the front wheel lighter and less predictable. Spread some weight forward.`,
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
      const item = items.find(i => i.id === selectedItem.itemId)
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
      if (!bag || bag.type === 'frame') continue

      const item = items.find(i => i.id === selectedItem.itemId)
      if (item && item.rigidity === 'rigid' && selectedItem.weight > 200 && bag.type === 'handlebar') {
        messages.push({
          severity: 'info',
          title: `Better placement for ${item.name}`,
          message: `Tip: your ${item.name.toLowerCase()} (${selectedItem.weight}g) would ride better in the frame bag — it keeps the weight low and centered.`,
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
      title: 'Looking great!',
      message: `${totalWeightKg.toFixed(1)}kg for ${state.event.name} is a solid setup. You've got everything you need and nothing you don't. 🤙`,
    })
  }

  return messages
}
