import type { WizardState } from '../types'

interface SerializedState {
  bike: WizardState['bike']
  event: WizardState['event']
  bags: WizardState['bags']
  selectedItems: WizardState['selectedItems']
}

export function serializeState(state: WizardState): string {
  const data: SerializedState = {
    bike: state.bike,
    event: state.event,
    bags: state.bags,
    selectedItems: state.selectedItems,
  }
  const json = JSON.stringify(data)
  return btoa(encodeURIComponent(json))
}

export function deserializeState(hash: string): SerializedState | null {
  try {
    const json = decodeURIComponent(atob(hash))
    const data = JSON.parse(json) as SerializedState
    if (data.bike && data.bags && data.selectedItems) {
      return data
    }
    return null
  } catch {
    return null
  }
}

export function getShareUrl(state: WizardState): string {
  const encoded = serializeState(state)
  return `${window.location.origin}${window.location.pathname}#config=${encoded}`
}
