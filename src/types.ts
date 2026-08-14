export type BikeType = 'road' | 'gravel' | 'touring' | 'mtb_hardtail' | 'mtb_full'
export type BikeSize = 'XS' | 'S' | 'M' | 'L' | 'XL'

export interface BikeSpec {
  type: BikeType
  label: string
  description: string
  defaultWeight: number // kg
  frameBagMaxVolume: Record<BikeSize, number> // L per size
}

export interface Bike {
  type: BikeType
  size: BikeSize
  weight: number
  frameBagMaxVolume: number
}

export type EventType = 'road' | 'gravel' | 'ultra' | 'expedition' | 'weekend'

export interface BikeEvent {
  id: string
  name: string
  type: EventType
  isBAS: boolean
  description: string
  recommendedWeight: { min: number; max: number }
  maxAcceptableWeight: number
  essentialItems: string[]
  unnecessaryItems: string[]
  tips: string[]
}

export type BagType = 'handlebar' | 'frame' | 'saddle' | 'top_tube' | 'fork' | 'rear_rack'
export type BagPosition = 'front_high' | 'center_low' | 'rear_mid' | 'top' | 'front_low'

export interface BagPreset {
  id: string
  type: BagType
  label: string
  position: BagPosition
  volume: number // L
  maxWeight: number // kg
  brand?: string
  model?: string
  bagWeight?: number // grams, weight of the bag itself
  waterproof?: boolean | string
  closure?: string
  recommended?: boolean
  basDiscount?: boolean
}

export interface Bag {
  id: string
  type: BagType
  position: BagPosition
  volume: number
  maxWeight: number
  brand?: string
  model?: string
  bagWeight?: number // grams
  recommended?: boolean
  items: string[] // assigned selected item IDs
}

// 'other' is the home for items the user adds by hand or imports from a CSV,
// where the source category doesn't map onto one of ours.
export type ItemCategory = 'clothes' | 'sleep' | 'tech' | 'repair' | 'hygiene' | 'food' | 'docs' | 'other'
export type ItemPriority = 'essential' | 'high' | 'medium' | 'low' | 'conditional'

export interface ItemSpec {
  id: string
  name: string
  category: ItemCategory
  weight: { min: number; max: number } // grams
  volume: { min: number; max: number } // liters
  priority: ItemPriority
  shape: 'rectangular' | 'cylindrical'
  rigidity: 'rigid' | 'soft'
  preferredBag?: BagType
  note?: string
  sponsorLink?: string
}

export interface SelectedItem {
  itemId: string
  bagId: string | null // null = selected but not assigned to a bag
  weight: number // grams PER UNIT, user-chosen value within range
  volume: number // liters PER UNIT, user-chosen value within range
  qty: number // how many you're bringing — totals multiply by this
  worn?: boolean // you're wearing it, so it never goes in a bag
  consumable?: boolean // food, water, gas — it shrinks as you ride
  auto?: boolean // true = pre-selected because it's essential for the chosen event (not a manual pick)
}

export interface WizardState {
  step: number
  bike: Bike | null
  event: BikeEvent | null
  bags: Bag[]
  selectedItems: SelectedItem[]
  customItems: ItemSpec[] // added by hand or imported from CSV — resolved alongside the catalog
  unit: UnitSystem
}

export type UnitSystem = 'metric' | 'imperial'

export type ValidationSeverity = 'error' | 'warning' | 'info' | 'success'

export interface ValidationMessage {
  severity: ValidationSeverity
  title: string
  message: string
  bagId?: string
  itemId?: string
}
