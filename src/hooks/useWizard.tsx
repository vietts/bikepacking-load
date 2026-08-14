import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import type { Bike, BikeEvent, Bag, ItemSpec, SelectedItem, UnitSystem, WizardState } from '../types'
import { deserializeState } from '../utils/url-state'
import { normalizeState } from '../utils/migrate'
import { BUILTIN_ITEMS, buildCatalog } from '../utils/catalog'
import { autoAssign } from '../utils/autopack'

const TOTAL_STEPS = 7
const STORAGE_KEY = 'bikeload:v1'

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
  | { type: 'SET_QTY'; itemId: string; qty: number }
  | { type: 'TOGGLE_WORN'; itemId: string }
  | { type: 'TOGGLE_CONSUMABLE'; itemId: string }
  | { type: 'UPDATE_ITEM_WEIGHT'; itemId: string; weight: number }
  | { type: 'UPDATE_ITEM_VOLUME'; itemId: string; volume: number }
  | { type: 'ADD_CUSTOM_ITEM'; item: ItemSpec; select: boolean }
  | { type: 'REMOVE_CUSTOM_ITEM'; itemId: string }
  | { type: 'IMPORT_ITEMS'; customItems: ItemSpec[]; selectedItems: SelectedItem[] }
  | { type: 'AUTO_ASSIGN' }
  | { type: 'SET_UNIT'; unit: UnitSystem }
  | { type: 'RESTORE_STATE'; state: WizardState }
  | { type: 'RESTART_KEEP_DATA' }
  | { type: 'RESET' }

const initialState: WizardState = {
  step: 1,
  bike: null,
  event: null,
  bags: [],
  selectedItems: [],
  customItems: [],
  unit: 'metric',
}

// Build a pre-selected "essential" item using the mid-point of its weight/volume range.
// Returns null if the item id has no matching spec.
function makeAutoItem(itemId: string): SelectedItem | null {
  const spec = BUILTIN_ITEMS.find(i => i.id === itemId)
  if (!spec) return null
  return {
    itemId,
    bagId: null,
    weight: Math.round((spec.weight.min + spec.weight.max) / 2),
    volume: +((spec.volume.min + spec.volume.max) / 2).toFixed(2),
    qty: 1,
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
          { itemId: action.itemId, bagId: null, weight: action.weight, volume: action.volume, qty: 1 },
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
    case 'SET_QTY':
      return {
        ...state,
        selectedItems: state.selectedItems.map(i =>
          i.itemId === action.itemId ? { ...i, qty: Math.max(1, Math.round(action.qty)) } : i
        ),
      }
    case 'TOGGLE_WORN':
      return {
        ...state,
        selectedItems: state.selectedItems.map(i => {
          if (i.itemId !== action.itemId) return i
          const worn = !i.worn
          // What you wear isn't in a bag — drop the assignment when it goes on your body.
          return { ...i, worn, bagId: worn ? null : i.bagId }
        }),
      }
    case 'TOGGLE_CONSUMABLE':
      return {
        ...state,
        selectedItems: state.selectedItems.map(i =>
          i.itemId === action.itemId ? { ...i, consumable: !i.consumable } : i
        ),
      }
    case 'ADD_CUSTOM_ITEM': {
      const customItems = [...state.customItems, action.item]
      if (!action.select) return { ...state, customItems }
      return {
        ...state,
        customItems,
        selectedItems: [
          ...state.selectedItems,
          {
            itemId: action.item.id,
            bagId: null,
            weight: action.item.weight.max,
            volume: action.item.volume.max,
            qty: 1,
          },
        ],
      }
    }
    case 'REMOVE_CUSTOM_ITEM':
      return {
        ...state,
        customItems: state.customItems.filter(i => i.id !== action.itemId),
        selectedItems: state.selectedItems.filter(i => i.itemId !== action.itemId),
      }
    case 'IMPORT_ITEMS': {
      // Imported rows are additive: an existing selection wins so a re-import
      // never silently overwrites quantities the user already tuned. Each import
      // mints fresh ids (see rowsToState), so itemId can never collide — name is
      // the only stable key a re-imported row shares with what's already there.
      const existingNames = new Set(state.customItems.map(i => i.name.trim().toLowerCase()))
      const newCustomItems = action.customItems.filter(
        i => !existingNames.has(i.name.trim().toLowerCase())
      )
      const newIds = new Set(newCustomItems.map(i => i.id))
      return {
        ...state,
        customItems: [...state.customItems, ...newCustomItems],
        selectedItems: [
          ...state.selectedItems,
          ...action.selectedItems.filter(i => newIds.has(i.itemId)),
        ],
      }
    }
    case 'AUTO_ASSIGN':
      return {
        ...state,
        selectedItems: autoAssign(state, buildCatalog(state.customItems)),
      }
    case 'SET_UNIT':
      return { ...state, unit: action.unit }
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

  // 1. Shared link (#config=...) — land on Review so a buddy sees the setup.
  const match = window.location.hash.match(/#config=(.+)$/)
  if (match) {
    const data = deserializeState(match[1])
    if (data && data.bike) {
      return { state: { ...data, step: 6 }, restoredFrom: 'url' }
    }
  }

  // 2. Saved session from a previous visit.
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      // Sessions saved before quantities/worn existed still parse — normalizeState
      // fills the new fields with values that reproduce the old numbers exactly.
      const saved = normalizeState(JSON.parse(raw))
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
  restartKeepingData: () => void
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

  const restartKeepingData = () => dispatch({ type: 'RESTART_KEEP_DATA' })

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
      case 6: return true
      case 7: return false
      default: return false
    }
  }

  return (
    <WizardContext.Provider value={{ state, dispatch, nextStep, prevStep, goToStep, canProceed, restoredFrom, dismissRestoreNotice, restartKeepingData, reset }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) throw new Error('useWizard must be used within WizardProvider')
  return context
}
