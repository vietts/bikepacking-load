import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { Bike, BikeEvent, Bag, WizardState, ItemSpec, SelectedItem } from '../types'
import { deserializeState } from '../utils/url-state'
import itemsData from '../data/items.json'

const TOTAL_STEPS = 7
const STORAGE_KEY = 'bike-load-sim-state'

const items = itemsData as ItemSpec[]

function defaultSelection(itemId: string): SelectedItem | null {
  const spec = items.find(i => i.id === itemId)
  if (!spec) return null
  return {
    itemId,
    bagId: null,
    weight: Math.round((spec.weight.min + spec.weight.max) / 2),
    volume: +((spec.volume.min + spec.volume.max) / 2).toFixed(2),
  }
}

type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'SET_BIKE'; bike: Bike }
  | { type: 'SET_EVENT'; event: BikeEvent }
  | { type: 'SET_BAGS'; bags: Bag[] }
  | { type: 'ADD_BAG'; bag: Bag }
  | { type: 'REMOVE_BAG'; bagId: string }
  | { type: 'TOGGLE_ITEM'; itemId: string; weight: number; volume: number }
  | { type: 'ASSIGN_ITEM'; itemId: string; bagId: string | null }
  | { type: 'ASSIGN_MANY'; assignments: { itemId: string; bagId: string | null }[] }
  | { type: 'UPDATE_ITEM_WEIGHT'; itemId: string; weight: number }
  | { type: 'UPDATE_ITEM_VOLUME'; itemId: string; volume: number }
  | { type: 'RESTORE_STATE'; state: WizardState }
  | { type: 'RESTART_KEEP_DATA' }
  | { type: 'RESET_ALL' }

const initialState: WizardState = {
  step: 1,
  bike: null,
  event: null,
  bags: [],
  selectedItems: [],
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: Math.max(1, Math.min(TOTAL_STEPS, action.step)) }
    case 'SET_BIKE':
      return { ...state, bike: action.bike }
    case 'SET_EVENT': {
      // Pre-populate the gear list with the event's essential items,
      // keeping anything the user already picked.
      const selectedIds = new Set(state.selectedItems.map(i => i.itemId))
      const additions = action.event.essentialItems
        .filter(id => !selectedIds.has(id))
        .map(defaultSelection)
        .filter((i): i is SelectedItem => i !== null)
      return { ...state, event: action.event, selectedItems: [...state.selectedItems, ...additions] }
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
    case 'ASSIGN_MANY': {
      const byItem = new Map(action.assignments.map(a => [a.itemId, a.bagId]))
      return {
        ...state,
        selectedItems: state.selectedItems.map(i =>
          byItem.has(i.itemId) ? { ...i, bagId: byItem.get(i.itemId) ?? null } : i
        ),
      }
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
    case 'RESTART_KEEP_DATA':
      // Back to the start, everything stays saved — bike, bags, gear.
      return { ...state, step: 1 }
    case 'RESET_ALL':
      return initialState
    default:
      return state
  }
}

function loadInitialState(): WizardState {
  // A shared link wins over the locally saved session.
  const hashMatch = window.location.hash.match(/#config=(.+)/)
  if (hashMatch) {
    const restored = deserializeState(hashMatch[1])
    if (restored) return { step: 6, ...restored }
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as WizardState
      if (parsed && typeof parsed.step === 'number' && Array.isArray(parsed.bags)) return parsed
    }
  } catch {
    // corrupted saved state — start fresh
  }
  return initialState
}

interface WizardContextType {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  canProceed: () => boolean
  restartKeepingData: () => void
  resetAll: () => void
}

const WizardContext = createContext<WizardContextType | null>(null)

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, undefined, loadInitialState)

  // Persist the session so users can come back (or restart) without losing anything.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full or unavailable — persistence is best-effort
    }
  }, [state])

  const nextStep = () => dispatch({ type: 'SET_STEP', step: state.step + 1 })
  const prevStep = () => dispatch({ type: 'SET_STEP', step: state.step - 1 })
  const goToStep = (step: number) => dispatch({ type: 'SET_STEP', step })

  const restartKeepingData = () => dispatch({ type: 'RESTART_KEEP_DATA' })
  const resetAll = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    dispatch({ type: 'RESET_ALL' })
  }

  const canProceed = () => {
    switch (state.step) {
      case 1: return state.bike !== null
      case 2: return state.event !== null
      case 3: return state.bags.length > 0
      case 4: return state.selectedItems.length > 0
      case 5: return true
      case 6: return true
      case 7: return false
      default: return false
    }
  }

  return (
    <WizardContext.Provider value={{ state, dispatch, nextStep, prevStep, goToStep, canProceed, restartKeepingData, resetAll }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) throw new Error('useWizard must be used within WizardProvider')
  return context
}
