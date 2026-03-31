# Bike Load Simulator — Design Spec

## Context

Bike Adventure Series (BAS) runs bikepacking events (TGE, Tuscany Trail, NC4000, FFP, Unpaved Roads) for a 60% international audience. The most common mistake participants make is packing wrong — too much gear, bad weight distribution, missing essentials. This tool solves that by simulating the packing process and giving real-time feedback.

Secondary goal: sponsor integration (bag/bike brands as presets) and lead generation (CTA to events/newsletter).

## Overview

A standalone, client-side web tool where users configure their bike, select bags, choose an event, and pack items into bags. The tool validates weight, volume, balance, and gives contextual advice per event.

**Tech stack:** React + Vite + Tailwind CSS. No backend — all data in JSON, state shareable via URL hash.

**Target users:** Bikepacking beginners preparing for a BAS event, and generic bikepackers. Tone: friendly expert, reassuring, never intimidating.

## User Flow: 6-Step Wizard

Each step is a dedicated screen. Users navigate forward/back via breadcrumb.

### Step 1 — What's your ride?
- Select bike type: road, gravel, touring, MTB hardtail, MTB full suspension
- Select size: XS, S, M, L, XL
- Illustrated cards for each bike type
- Contextual tip: "Most BAS riders use a gravel or road bike"
- Bike type + size determines default weight and max frame bag volume

### Step 2 — Where are you going?
- Two paths:
  - **BAS event**: TGE, Tuscany Trail, NC4000, FFP, Unpaved Roads (each with pre-configured recommendations)
  - **Generic trip type**: weekend, multi-day road, multi-day gravel, ultra, expedition
- Selection determines: recommended weight range, max acceptable weight, essential items, unnecessary items, contextual tips

### Step 3 — Pick your bags
- Available bag types: handlebar, frame, saddle, top tube, fork cages, rear rack
- For each bag: choose preset (including sponsor brand presets) or custom (enter volume + max weight)
- Volume set via slider or S/M/L preset sizes
- Frame bag max volume is adjusted by bike type + size from step 1
- Top-down preview populates as bags are added

### Step 4 — Pack your gear
**Left panel — Gear list:**
- Category tabs: Clothes, Sleep, Tech, Repair, Hygiene, Food, Docs
- Items pre-loaded from KNOWLEDGE.md catalog with weight (range min-max in grams) and volume (range min-max in liters)
- ESSENTIAL items for the selected event are pre-checked with green badge
- CONDITIONAL items show contextual note (e.g., "For TGE you won't need a sleeping bag — B&Bs along the route")
- Checkbox to select/deselect items
- Dropdown to assign selected item to a specific bag
- "Add custom item" button for items not in catalog

**Right panel — Bag view:**
- Each bag shows:
  - Weight progress bar (current / max kg)
  - Volume progress bar (current / max L)
  - Chips with assigned item names
- Total weight summary at bottom with event-specific feedback

### Step 5 — Your load at a glance
Summary dashboard:
- Top-down bag visualization with items inside
- Total weight + comparison to event recommended range
- Per-bag weight/volume bar charts
- Weight distribution: front/center/rear percentage
- Warnings panel (see Validation Rules below)
- Suggestions panel
- Missing essentials checklist

### Step 6 — Share & Save
- Generate shareable URL (base64-encoded JSON in URL hash)
- Print packing list option
- CTA: sign up for the BAS event / subscribe to newsletter
- "Show this to your riding buddies!"

## Data Model

### Bike
```typescript
interface Bike {
  type: "road" | "gravel" | "touring" | "mtb_hardtail" | "mtb_full"
  size: "XS" | "S" | "M" | "L" | "XL"
  weight: number              // kg, default per type
  frameBagMaxVolume: number   // L, computed from type + size
}
```

### Event
```typescript
interface BikepEvent {
  id: string                  // "tge" | "tt" | "nc4000" | "ffp" | "unpaved" | custom types
  name: string
  type: "road" | "gravel" | "ultra" | "expedition" | "weekend"
  recommendedWeight: { min: number; max: number }  // kg
  maxAcceptableWeight: number                       // kg
  essentialItems: string[]     // item IDs
  unnecessaryItems: string[]   // item IDs
  tips: string[]
}
```

### Bag
```typescript
interface Bag {
  id: string
  type: "handlebar" | "frame" | "saddle" | "top_tube" | "fork" | "rear_rack"
  position: "front_high" | "center_low" | "rear_mid" | "top" | "front_low"
  volume: number              // L
  maxWeight: number           // kg
  brand?: string              // sponsor preset
  model?: string
  items: string[]             // assigned item IDs
}
```

### Item
```typescript
interface Item {
  id: string
  name: string
  category: "clothes" | "sleep" | "tech" | "repair" | "hygiene" | "food" | "docs"
  weight: { min: number; max: number }   // grams (range)
  volume: { min: number; max: number }   // liters (range)
  priority: "essential" | "high" | "medium" | "low" | "conditional"
  shape: "rectangular" | "cylindrical"    // metadata for future use
  rigidity: "rigid" | "soft"             // metadata for future use
  preferredBag?: string                   // suggested bag type for auto-assign
  note?: string
  sponsorLink?: string
}
```

### Weight/Volume Calculation
Items have weight and volume ranges (min-max). For calculations:
- Default: use the **average** of min and max
- Each item card shows a small slider so the user can adjust within the range (e.g., "I have the ultralight version" → slide toward min)
- The selected value is what gets used in all calculations and saved in URL state

### URL State
State serialized as: `#config=<base64(JSON.stringify({bike, event, bags, selectedItems}))>`
where selectedItems includes the item ID, assigned bag, and the user's chosen weight/volume within the range.

## Validation Rules

### Warnings (orange/red)

| Rule | Threshold | Message tone |
|------|-----------|-------------|
| Total weight over max | > event.maxAcceptableWeight | "Your total load is Xkg — for {event} we recommend under {max}kg" |
| Handlebar bag too heavy | > 5 kg | "Above 4-5kg your steering gets sketchy" |
| Saddle bag too heavy | > 5 kg | "It'll start swaying side to side" |
| Rear-heavy balance | > 60% rear | "Front wheel lighter and less predictable" |
| Bag volume overflow | > 90% capacity | "Leave room for snacks along the way" |

### Missing Essentials (red)
For each ESSENTIAL item not selected: "Don't forget your {item}!"

### Suggestions (blue/green)
| Rule | Trigger | Message tone |
|------|---------|-------------|
| Unnecessary item packed | Item in event.unnecessaryItems | "For {event} you probably won't need it" |
| Optimal setup achieved | Weight in range + all essentials + no warnings | "Looking great! Xkg is a solid setup 🤙" |
| Better placement | Heavy item in handlebar instead of frame | "Would ride better in the frame bag" |

All messages use friendly expert tone — suggestions, never commands.

## Item Metadata: Shape & Rigidity (Future)

Each item tracks shape (rectangular/cylindrical) and rigidity (rigid/soft) as metadata. For MVP these are stored but not used in calculations. Future enhancements:
- Soft items: compressed volume at 70-80% of nominal
- Cylindrical items: lower packing efficiency (leave gaps)
- Packing order suggestions: rigid items at bottom, soft items fill spaces

## Sponsor Integration

Sponsor brands appear as bag/bike presets in the selection steps:
- Step 1: Sponsor bike frames in the bike picker
- Step 3: Sponsor bags with logo, model name, specs pre-filled
- Items may include sponsorLink for brand product pages

No ads, no banners — integration is native through the preset system.

## Mobile Considerations

The wizard flow works well on mobile (one step at a time). Step 4 requires special attention:
- On mobile: gear list and bag view stack vertically (list on top, bags below)
- Category tabs scroll horizontally
- Bag assignment via bottom sheet instead of dropdown

## Project Structure
```
bike-load-simulator/
├── docs/                    # This spec + future docs
├── KNOWLEDGE.md             # Source data for items, events, bags
├── src/
│   ├── components/
│   │   ├── wizard/          # Step components (Step1Bike, Step2Event, etc.)
│   │   ├── packing/         # GearList, BagView, ItemCard, BagCard
│   │   ├── results/         # Summary, Warnings, Suggestions
│   │   └── ui/              # Shared: ProgressBar, Breadcrumb, Card, Badge
│   ├── data/
│   │   ├── bikes.json       # Bike types with defaults
│   │   ├── events.json      # BAS events + generic types
│   │   ├── bags.json        # Bag presets (including sponsor brands)
│   │   └── items.json       # Full item catalog from KNOWLEDGE.md
│   ├── hooks/               # useWizard, usePacking, useValidation
│   ├── utils/
│   │   ├── validation.ts    # Weight/volume/balance rules
│   │   └── url-state.ts     # Serialize/deserialize state to URL
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## Verification Plan

1. **Unit tests**: Validation rules (weight limits, balance calculation, missing essentials)
2. **Manual walkthrough**: Complete wizard flow for each BAS event, verify recommendations match KNOWLEDGE.md
3. **Mobile test**: Step 4 layout on 375px viewport
4. **URL sharing**: Generate URL, open in new tab, verify state restores correctly
5. **Edge cases**: Empty bags, all items selected, custom items only, no event selected
