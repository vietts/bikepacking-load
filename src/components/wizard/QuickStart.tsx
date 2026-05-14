import { useWizard } from '../../hooks/useWizard'
import bagsData from '../../data/bags-bike24.json'
import eventsData from '../../data/events.json'
import itemsData from '../../data/items.json'
import type {
  BagPreset, BagType, BikeEvent, BikeSize, BikeType,
  ItemSpec, SelectedItem, Bag, WizardState,
} from '../../types'

const bagPresets = bagsData as BagPreset[]
const events = eventsData as BikeEvent[]
const items = itemsData as ItemSpec[]

interface PresetTemplate {
  id: string
  title: string
  blurb: string
  bikeType: BikeType
  bikeSize: BikeSize
  frameBagMaxVolume: number
  bikeWeight: number
  eventId: string
  bagTypes: BagType[]
}

const PRESETS: PresetTemplate[] = [
  {
    id: 'first_weekend',
    title: 'My first weekend',
    blurb: 'Short gravel weekend. Light, simple, no camping.',
    bikeType: 'gravel',
    bikeSize: 'M',
    frameBagMaxVolume: 5,
    bikeWeight: 9.5,
    eventId: 'unpaved',
    bagTypes: ['frame', 'saddle'],
  },
  {
    id: 'tuscany_starter',
    title: 'Tuscany Trail',
    blurb: 'Italy\'s biggest gravel event. Multi-day, bivouac possible.',
    bikeType: 'gravel',
    bikeSize: 'M',
    frameBagMaxVolume: 5,
    bikeWeight: 9.5,
    eventId: 'tt',
    bagTypes: ['handlebar', 'frame', 'saddle', 'top_tube'],
  },
  {
    id: 'grand_escape',
    title: 'Road bikepacking',
    blurb: '3-5 days on tarmac. B&Bs along the way.',
    bikeType: 'road',
    bikeSize: 'M',
    frameBagMaxVolume: 4,
    bikeWeight: 8,
    eventId: 'tge',
    bagTypes: ['handlebar', 'frame', 'saddle'],
  },
]

function pickBagPresetFor(type: BagType, frameBagMaxVolume?: number): BagPreset | undefined {
  const candidates = bagPresets.filter(p => p.type === type)
  if (candidates.length === 0) return undefined
  const recommended = candidates.find(p => p.recommended)
  const chosen = recommended ?? candidates[Math.floor(candidates.length / 2)]
  if (type === 'frame' && frameBagMaxVolume !== undefined && chosen.volume > frameBagMaxVolume) {
    return { ...chosen, volume: frameBagMaxVolume }
  }
  return chosen
}

function buildBag(preset: BagPreset, idSuffix: number): Bag {
  return {
    id: `${preset.type}_${idSuffix}`,
    type: preset.type,
    position: preset.position,
    volume: preset.volume,
    maxWeight: preset.maxWeight,
    brand: preset.brand,
    model: preset.model,
    bagWeight: preset.bagWeight,
    recommended: preset.recommended,
    items: [],
  }
}

const FALLBACK: BagType[] = ['frame', 'saddle', 'handlebar', 'top_tube', 'fork', 'rear_rack']

export function QuickStart() {
  const { dispatch } = useWizard()

  function applyPreset(preset: PresetTemplate) {
    const event = events.find(e => e.id === preset.eventId)
    if (!event) return

    // Build bags
    const bags: Bag[] = []
    let idx = 0
    for (const bagType of preset.bagTypes) {
      const bagPreset = pickBagPresetFor(bagType, bagType === 'frame' ? preset.frameBagMaxVolume : undefined)
      if (bagPreset) bags.push(buildBag(bagPreset, ++idx))
    }

    // Select essentials + auto-assign to preferred (or fallback) bag
    const selectedItems: SelectedItem[] = []
    const bagByType = new Map(bags.map(b => [b.type, b]))
    function bagIdFor(preferred?: BagType): string | null {
      if (preferred && bagByType.has(preferred)) return bagByType.get(preferred)!.id
      for (const t of FALLBACK) if (bagByType.has(t)) return bagByType.get(t)!.id
      return null
    }
    for (const itemId of event.essentialItems) {
      const item = items.find(i => i.id === itemId)
      if (!item) continue
      const avgWeight = Math.round((item.weight.min + item.weight.max) / 2)
      const avgVolume = +((item.volume.min + item.volume.max) / 2).toFixed(2)
      selectedItems.push({ itemId, bagId: bagIdFor(item.preferredBag), weight: avgWeight, volume: avgVolume })
    }

    const newState: WizardState = {
      step: 4,
      bike: {
        type: preset.bikeType,
        size: preset.bikeSize,
        weight: preset.bikeWeight,
        frameBagMaxVolume: preset.frameBagMaxVolume,
      },
      event,
      bags,
      selectedItems,
    }
    dispatch({ type: 'RESTORE_STATE', state: newState })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="card card-border bg-gradient-to-br from-accent/8 via-base-100 to-primary/5 p-5 space-y-4">
      <div>
        <p className="label-caps text-accent">Quick start</p>
        <p className="text-body text-base-content/65 mt-1">
          Not sure where to start? Pick a template — we'll set up the bike, bags and gear for you. You can tweak everything after.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className="card card-border bg-base-100 p-4 text-left card-hover cursor-pointer"
          >
            <div className="heading-md text-sm">{preset.title}</div>
            <div className="text-small text-base-content/55 mt-1">{preset.blurb}</div>
            <div className="text-small text-accent font-medium mt-2.5">Use this template →</div>
          </button>
        ))}
      </div>
    </div>
  )
}
