import type { WizardState } from '../types'
import { normalizeState } from './migrate'

interface SerializedState {
  bike: WizardState['bike']
  event: WizardState['event']
  bags: WizardState['bags']
  selectedItems: WizardState['selectedItems']
  customItems: WizardState['customItems']
  unit: WizardState['unit']
}

export function serializeState(state: WizardState): string {
  const data: SerializedState = {
    bike: state.bike,
    event: state.event,
    bags: state.bags,
    selectedItems: state.selectedItems,
    // Without these a shared link would render hand-added and imported gear as raw ids.
    customItems: state.customItems,
    unit: state.unit,
  }
  const json = JSON.stringify(data)
  return btoa(encodeURIComponent(json))
}

/**
 * Links generated before quantities and custom items existed are still valid:
 * normalizeState backfills the new fields so an old setup shows the same numbers.
 */
export function deserializeState(hash: string): WizardState | null {
  try {
    const json = decodeURIComponent(atob(hash))
    const data = normalizeState(JSON.parse(json))
    if (data && data.bike) return data
    return null
  } catch {
    return null
  }
}

export function getShareUrl(state: WizardState): string {
  const encoded = serializeState(state)
  return `${window.location.origin}${window.location.pathname}#config=${encoded}`
}
