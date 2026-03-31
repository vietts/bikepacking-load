import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Bike, BikeEvent, Bag, WizardState } from '../types'

const TOTAL_STEPS = 6

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
    case 'SET_EVENT':
      return { ...state, event: action.event }
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
    default:
      return state
  }
}

interface WizardContextType {
  state: WizardState
  dispatch: React.Dispatch<WizardAction>
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  canProceed: () => boolean
}

const WizardContext = createContext<WizardContextType | null>(null)

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState)

  const nextStep = () => dispatch({ type: 'SET_STEP', step: state.step + 1 })
  const prevStep = () => dispatch({ type: 'SET_STEP', step: state.step - 1 })
  const goToStep = (step: number) => dispatch({ type: 'SET_STEP', step })

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
    <WizardContext.Provider value={{ state, dispatch, nextStep, prevStep, goToStep, canProceed }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) throw new Error('useWizard must be used within WizardProvider')
  return context
}
