import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import type { Bike, BikeEvent, Bag, ItemSpec, SelectedItem, WizardState } from '../types'
import { deserializeState } from '../utils/url-state'
import itemsData from '../data/items.json'

const TOTAL_STEPS = 6
const STORAGE_KEY = 'bikeload:v1'

const items = itemsData as ItemSpec[]

type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_BIKE'; bike: Bike }
  | { type: 'SET_EVENT'; event: BikeEvent }
  | { type: 'SET_BAGS'; bags: Bag[] }
  | { type: 'ADD_BAG'; bag: Bag }
  | { type: 'REMOVE_BAG'; bagId: string }
  | { type: 'TOGGLE_ITEM'; itemId: string; weight: number; volume: number }
  | { type: 'ASSIGN_ITEM'; itemId: string; bagId: string | null }
  | { type: 'UPDATE_ITEM_WEIGHT'; itemId: string; weight: number }
  | { type: 'UPDATE_ITEM_VOLUME'; itemId: string; volume: number }
  | { type: 'RESTORE_STATE'; state: WizardState }
  | { type: 'RESET' }

const initialState: WizardState = {
  step: 1,
  bike: null,
  event: null,
  bags: [],
  selectedItems: [],
}

// Build a pre-selected "essential" item using the mid-point of its weight/volume range.
// Returns null if the item id has no matching spec.
function makeAutoItem(itemId: string): SelectedItem | null {
  const spec = items.find(i => i.id === itemId)
  if (!spec) return null
  return {
    itemId,
    bagId: null,
    weight: Math.round((spec.weight.min + spec.weight.max) / 2),
    volume: +((spec.volume.min + spec.volume.max) / 2).toFixed(2),
    auto: true,
  }
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: Math.max(1, Math.min(TOTAL_STEPS, action.step)) }
    case 'SET_BIKE':
      return { ...state, bike: action.bike }
    case 'SET_EVENT': {
      const newEssentials = action.event.essentialItems
      // Keep everything the user picked or customized; drop only the *auto* items
      // that were essential for the previous event but aren't for the new one.
      const kept = state.selectedItems.filter(i => !i.auto || newEssentials.includes(i.itemId))
      const existing = new Set(kept.map(i => i.itemId))
      const added = newEssentials
        .filter(id => !existing.has(id))
        .map(makeAutoItem)
        .filter((i): i is SelectedItem => i !== null)
      return { ...state, event: action.event, selectedItems: [...kept, ...added] }
    }
    case 'SET_BAGS':
      return { ...state, bags: action.bags }
    case 'ADD_BAG':
      return { ...state, bags: [...state.bags, action.bag] }
    case 'REMOVE_BAG': {
      const updatedItems = state.selectedItems.map(item =>
        item.bagId === action.bagId ? { ...item, bagId: null } : item
      )
      return {
        ...state,
        bags: state.bags.filter(b => b.id !== action.bagId),
        selectedItems: updatedItems,
      }
    }
    case 'TOGGLE_ITEM': {
      const exists = state.selectedItems.find(i => i.itemId === action.itemId)
      if (exists) {
        return {
          ...state,
          selectedItems: state.selectedItems.filter(i => i.itemId !== action.itemId),
        }
      }
      return {
        ...state,
        selectedItems: [
          ...state.selectedItems,
          { itemId: action.itemId, bagId: null, weight: action.weight, volume: action.volume },
        ],
      }
    }
    case 'ASSIGN_ITEM':
      return {
        ...state,
        selectedItems: state.selectedItems.map(i =>
          i.itemId === action.itemId ? { ...i, bagId: action.bagId } : i
        ),
      }
    case 'UPDATE_ITEM_WEIGHT':
      return {
        ...state,
        selectedItems: state.selectedItems.map(i =>
          i.itemId === action.itemId ? { ...i, weight: action.weight } : i
        ),
      }
    case 'UPDATE_ITEM_VOLUME':
      return {
        ...state,
        selectedItems: state.selectedItems.map(i =>
          i.itemId === action.itemId ? { ...i, volume: action.volume } : i
        ),
      }
    case 'RESTORE_STATE':
      return action.state
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export type RestoredFrom = 'url' | 'storage' | null

function hasContent(state: WizardState): boolean {
  return !!state.bike || state.bags.length > 0 || state.selectedItems.length > 0
}

// Resolve the initial state once, with precedence: shared URL > saved session > empty.
function resolveInitialState(): { state: WizardState; restoredFrom: RestoredFrom } {
  if (typeof window === 'undefined') return { state: initialState, restoredFrom: null }

  // 1. Shared link (#config=...) — land on Results so a buddy sees the setup.
  const match = window.location.hash.match(/#config=(.+)$/)
  if (match) {
    const data = deserializeState(match[1])
    if (data && data.bike) {
      return {
        state: {
          step: 5,
          bike: data.bike,
          event: data.event,
          bags: data.bags,
          selectedItems: data.selectedItems,
        },
        restoredFrom: 'url',
      }
    }
  }

  // 2. Saved session from a previous visit.
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as WizardState
      if (saved && hasContent(saved)) {
        return { state: saved, restoredFrom: 'storage' }
      }
    }
  } catch {
    // ignore corrupt storage
  }

  return { state: initialState, restoredFrom: null }
}

interface WizardContextType {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  canProceed: () => boolean
  restoredFrom: RestoredFrom
  dismissRestoreNotice: () => void
  reset: () => void
}

const WizardContext = createContext<WizardContextType | null>(null)

export function WizardProvider({ children }: { children: ReactNode }) {
  // Resolve URL/localStorage/empty exactly once (lazy state initializer).
  const [init] = useState(resolveInitialState)

  const [state, dispatch] = useReducer(wizardReducer, init.state)
  const [restoredFrom, setRestoredFrom] = useState<RestoredFrom>(init.restoredFrom)

  // Persist the session on every change so a reload never loses the setup.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full or unavailable — non-fatal
    }
  }, [state])

  const nextStep = () => dispatch({ type: 'SET_STEP', step: state.step + 1 })
  const prevStep = () => dispatch({ type: 'SET_STEP', step: state.step - 1 })
  const goToStep = (step: number) => dispatch({ type: 'SET_STEP', step })

  const dismissRestoreNotice = () => setRestoredFrom(null)

  const reset = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    setRestoredFrom(null)
    dispatch({ type: 'RESET' })
  }

  const canProceed = () => {
    switch (state.step) {
      case 1: return state.bike !== null
      case 2: return state.event !== null
      case 3: return state.bags.length > 0
      case 4: return state.selectedItems.length > 0
      case 5: return true
      case 6: return false
      default: return false
    }
  }

  return (
    <WizardContext.Provider value={{ state, dispatch, nextStep, prevStep, goToStep, canProceed, restoredFrom, dismissRestoreNotice, reset }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) throw new Error('useWizard must be used within WizardProvider')
  return context
}
