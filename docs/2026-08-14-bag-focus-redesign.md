# Bag-Focus Redesign — One Bag at a Time

## Why

The original 6-step wizard packed all gear on a single screen (Step 4), with every bag
visible at once and a per-item bag dropdown. For first-time bikepackers — our core
audience — that's a lot to process at once. This redesign borrows from videogame
inventory UIs (clear slots, one focused container, pre-filled suggestions) while
explicitly fighting cognitive overload: **the user only ever thinks about one bag at
a time**.

## New flow (7 steps)

1. **Ride** — pick a stylized bike type + size, and optionally type the actual bike
   model (free text, e.g. "Canyon Grizl").
2. **Trip** — pick a BAS event or generic trip type. Selecting it **pre-populates the
   gear list** with that event's essential items.
3. **Bags** — unchanged: pick bags per position.
4. **Gear** — the master checklist. Essentials come pre-checked; the user adds or
   removes freely. Copy makes it clear this is *a draft, not the final list*: nothing
   about bag placement is decided here (the old per-item bag dropdown is gone).
5. **Pack** *(new)* — bag-by-bag focus mode:
   - An inventory-style strip shows all bags with item counts; one bag is focused.
   - On entry, unplaced items are **auto-assigned to their preferred bag** (when that
     bag exists), so each bag starts pre-populated.
   - The focused bag shows weight/volume gauges, its items (movable to other bags or
     set aside), a "Still to place" pool (items that fit this bag are flagged first),
     and "Ideas for this bag" — catalog suggestions not yet on the list, one tap to add.
   - Prev/next navigation walks through bags one by one.
6. **Review** — the existing results screen (totals, distribution, validation).
7. **Share** — share/print, plus **"Start over (keep my setup)"**: restarts the wizard
   with bike, bags and gear intact. A separate "Start from scratch" wipes everything.

## Persistence

The whole wizard state is saved to `localStorage` on every change and restored on
load, so users can leave and come back — or restart — without losing anything.
A `#config=` share URL still wins over the saved session and lands on Review.
