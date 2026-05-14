# Bike Load Simulator — Design handoff

**Data:** 2026-05-14
**Branch:** `claude/improve-ux-event-participation-kMe0d`
**Stato:** prima passata UX completa, in attesa di allineamento col design system BAS.

---

## 1. Contesto in 30 secondi

Il tool aiuta chi non ha mai fatto bikepacking a capire **cosa portare e come distribuirlo sulla bici**, in modo che il timore di "non essere pronti" smetta di essere un ostacolo all'iscrizione agli eventi BAS.

Target: ciclisti amatoriali 30-50 anni, 60% internazionali, spesso alla prima esperienza. Tono di voce richiesto dal brand: **amico esperto, non manuale tecnico**.

Il tool vive come lead magnet sul sito BAS e (in prospettiva) come destinazione di campagne, embed e newsletter.

---

## 2. Cosa è cambiato in questa passata

L'intervento è stato concentrato su **UX e interazione**, non su design visuale. Il design system attuale è una stesura provvisoria con daisyUI: tutto è negoziabile in fase di restyling.

### 2.1 Visualizzazione bici live (`src/components/wizard/BikeViewer.tsx`)

Una silhouette SVG della bici, vista laterale, dove le borse compaiono nel punto anatomicamente corretto man mano che vengono selezionate. È il differenziatore vero del tool: serve a far dire all'utente "ah, ecco com'è fatto un setup di bikepacking".

- 6 footprint di borse posizionati come overlay (handlebar, top tube, frame, saddle, fork, rear rack)
- I colori delle borse cambiano in base al riempimento: pallido → primary → warning → error
- Un heat-gradient di sfondo mostra la distribuzione del peso fronte/centro/retro
- Slot vuoti appaiono come tratteggio "+ HANDLEBAR" — affordance per aggiungere
- Animazione di ingresso con `gsap.back.out` quando viene aggiunta una borsa
- Usato in Step 3 (sticky a destra), Step 4 (sticky a destra), Step 5 (hero) e Step 6 (dentro la summary card condivisibile)

### 2.2 Smart Pack (`src/components/wizard/Step4Pack.tsx`)

Pulsante "Pack for me" nell'header di Step 4 che:
- aggiunge tutti gli essentials dell'evento selezionato non ancora in lista, con peso/volume medi del range
- assegna ogni item alla `preferredBag` (definita in `items.json`), con fallback frame → saddle → handlebar → top_tube → fork → rear_rack

Inoltre il toggle di un singolo item ora lo auto-assegna immediatamente alla borsa preferita, e la borsa target lampeggia 1.4s nel BikeViewer per dare feedback visivo.

### 2.3 Quick-start template (`src/components/wizard/QuickStart.tsx`)

In cima a Step 1, prima del bike picker, tre card preset:
- "My first weekend" (gravel/unpaved roads)
- "Tuscany Trail" (gravel/multi-day)
- "Road bikepacking" (road/TGE)

Un click compila bici + evento + borse consigliate + essentials assegnati, e salta diretto a Step 4. L'utente arriva sul Pack screen con il setup già costruito e può solo limare.

### 2.4 Persistenza state (`src/hooks/useWizard.tsx`)

Lo state del wizard ora persiste in `localStorage` (`bas-bike-load:v1`) e si reidrata al boot. Il link share `#config=...` continua ad avere priorità e apre direttamente lo Step 5 (Results). Nell'header compare un link "Start over" (solo se c'è progresso da resettare).

### 2.5 Riscrittura copy (`src/utils/validation.ts`, `Step4Pack.tsx`)

Una passata sui messaggi più freddi/tecnici:
- "Too much weight" → "A bit too much. The weight you don't bring is the weight you don't feel."
- "Rigid/cylindrical items take up more space than their size" → "Hard items leave gaps inside, so they take more room than their numbers say"
- "Missing: X" → "You'll want: X — you won't miss it until the moment you really need it"
- "Looking great!" → "This is a solid setup. Exactly where you want to be."

### 2.6 CTA finale contestuale (`src/components/wizard/Step6Share.tsx`)

Quando l'utente arriva allo Step 6 dopo aver selezionato un evento BAS, vede:
- label "You're ready for"
- titolo dell'evento
- una citazione/tip narrativo dell'evento
- bottone primario "Sign up for {nome evento}" che deep-linka alla pagina dell'evento

Se l'evento selezionato non è BAS o è null, fallback su CTA generica "Explore events / Get the newsletter".

---

## 3. Cosa serve dal designer

Tutto quanto sotto è da intendersi come "aperto" — sono punti di partenza da rivedere e riarmonizzare con il design system BAS, non scelte finali.

### 3.1 Allineamento al design system

**File chiave:** `src/index.css` definisce un tema daisyUI 5 chiamato `bas` con tokens oklch.

| Token attuale | Valore provvisorio | Note |
|---|---|---|
| `--color-primary` | oklch(32% 0.09 150) | Verde scuro foresta |
| `--color-secondary` | oklch(42% 0.07 55) | Terra calda |
| `--color-accent` | oklch(62% 0.18 42) | Arancione caldo (usato per "Recommended" e Quick-start) |
| `--color-base-100/200/300` | oklch sui beige caldi | Tonalità "carta" |
| `--font-heading` | Space Grotesk | Da rivedere |
| `--font-sans` | Inter | Da rivedere |
| `--radius-box/field/selector` | 12 / 6 / 8 px | Tutto rivedibile |

Quasi tutti i componenti usano `bg-base-100`, `border-base-300`, `text-base-content/N` e i color token, quindi cambiare il tema in `index.css` propaga ovunque. Pattern custom (es. `.card-selected`, `.card-hover`, `.badge-pulse`, `.timeline-step`, `.bg-topo`, `.grain`) sono nello stesso file.

### 3.2 BikeViewer — silhouette e linguaggio visivo

Il componente SVG attuale è funzionalmente corretto ma graficamente neutro. Punti da definire col designer:

- **Stile della silhouette**: line-art tecnica (stato attuale) o qualcosa di più espressivo / illustrato / fotografico-stilizzato?
- **Quanto variare la silhouette tra tipi di bici**: oggi cambiano solo handlebar, spessore copertoni, forcella ammortizzata. Vogliamo gravel/road/touring più distinte?
- **Footprint borse**: forme attuali sono rettangoli morbidi. Si possono rendere riconoscibili come tipologie (roll vs wedge vs pannier) per insegnare al neofita?
- **Heat-map sfondo**: oggi gradienti morbidi nelle 3 zone front/center/rear. Tenerli o sostituire con una visualizzazione diversa (es. baricentro, bilancia)?
- **Stati overload**: oggi è solo rosso sulla borsa, magari con un'icona/animazione si comunica meglio.
- **Etichette**: oggi mostrano "FRAME 1.2kg" sopra la borsa. Tipografia, peso visivo, posizione tutto da rivedere.

File: `src/components/wizard/BikeViewer.tsx`. Coordinate viewBox `0 0 440 280`, posizioni borse nell'array `BAG_FOOTPRINTS`.

### 3.3 Quick-start cards (Step 1)

L'invito a usare un template è probabilmente la **decisione di conversione più importante** del tool — chi clicca qui salta tutta la fatica di costruire un setup.

Da rivedere:
- Gerarchia visiva: oggi tre card chiare con leggero gradient accent; potrebbero essere molto più forti (immagine evento, intensity).
- Numero di preset: tre o quattro? Vogliamo includere NorthCape4000 / Patagonia anche se intimidiscono?
- Copy: "My first weekend / Tuscany Trail / Road bikepacking" — i nomi sono ok o vanno più "BAS-branded"?
- Eventuale call-out tipo "Used by 80% of riders" per dare social proof.

File: `src/components/wizard/QuickStart.tsx`.

### 3.4 Step 4 (Pack) — layout

Il punto di massima complessità cognitiva. Oggi:
- Sinistra: tab di categoria + lista checkbox di gear con assegnazione via `<select>` nativo
- Destra (sticky): BikeViewer + dettaglio per borsa + peso totale

Domande aperte per il designer:
- L'item picker con checkbox + native select su mobile è scomodo. Vogliamo un pattern più tattile? (es. drag-to-bag, chip drop, modal di assegnazione)
- I dettagli per borsa a destra duplicano in parte l'info del BikeViewer. Possiamo collassarli in un solo modulo?
- La label-caps "Your bags" è asciutta. Tono BAS suggerirebbe qualcosa come "On the bike" o "Where it goes".

File: `src/components/wizard/Step4Pack.tsx`.

### 3.5 Tone di voce nei microcopy

La passata di rewrite ha toccato i messaggi più freddi, ma c'è altro su cui passare:
- Headings degli step ("What's your ride?" / "Where are you going?" / "Pick your bags" / "Pack your gear" / "Your load at a glance" / "Share your setup") — vanno bene o si vuole un tono più "BAS"?
- Tip/info boxes ("Most BAS riders use a gravel or road bike. Don't overthink it — any bike works for bikepacking!") sono solo abbozzati.
- Termini tecnici che restano: "frame bag max volume", "max acceptable weight". Si possono ammorbidire o servono?

I messaggi di validazione sono tutti in `src/utils/validation.ts`.

### 3.6 Step 6 (Share) — output condivisibile

Oggi il summary è una card semplice con titolo, BikeViewer, e lista per borsa. Se l'obiettivo è "show to your riding buddies", probabilmente serve un asset più studiato come **immagine social** (formato 1:1 o 4:5) generabile/scaricabile, con branding BAS evidente.

Domande:
- Vogliamo un "scarica come immagine"? (è un'aggiunta non banale ma fattibile via html-to-image)
- La card stampa-friendly ha senso o togliamo `print:hidden`?
- Lo share URL truncato in un input è funzionale, ma per audience non tech servirebbe un'esperienza più tipo "Web Share API + copia link".

File: `src/components/wizard/Step6Share.tsx`.

### 3.7 CTA contestuale evento

Le URL dei 5 eventi BAS sono hardcoded in `Step6Share.tsx`:

```
tge     → bikeadventureseries.com/the-grand-escape
tt      → bikeadventureseries.com/tuscany-trail
nc4000  → bikeadventureseries.com/northcape4000
ffp     → bikeadventureseries.com/final-frontier-patagonia
unpaved → bikeadventureseries.com/unpaved-roads
```

Da confermare con BAS che siano corrette (sono mie ipotesi sui slug). Idealmente vivono in un JSON insieme agli eventi.

### 3.8 Mobile

Tutto il tool è stato testato a buon senso su layout responsive, ma serve una passata vera su mobile reale. Punti già noti deboli:
- Step 4 su mobile: l'aside (BikeViewer + dettaglio borse) è sotto la lista item; l'utente seleziona un item ma non vede la bici fillarsi se non scrolla. Va ripensato (sticky inline? mini-viewer floating?).
- Native `<select>` di assegnazione borsa su iOS è ingombrante.
- L'header con timeline a 6 step diventa indicatore-dots su mobile, ma la stessa scelta forse va riconsiderata.

---

## 4. Mappa file

```
src/
  App.tsx
  index.css                                    ← tokens design system
  components/wizard/
    WizardLayout.tsx                           ← header + step transitions + nav
    BikeViewer.tsx                             ← NEW: silhouette + bag overlays
    QuickStart.tsx                             ← NEW: preset cards in Step 1
    Step1Bike.tsx                              ← bike type + size + QuickStart
    Step2Event.tsx                             ← event/trip picker
    Step3Bags.tsx                              ← bag selection + BikeViewer sidebar
    Step4Pack.tsx                              ← item picker + Smart Pack + BikeViewer
    Step5Results.tsx                           ← weight hero + bag breakdown + feedback
    Step6Share.tsx                             ← summary card + contextual CTA
  hooks/
    useWizard.tsx                              ← state + localStorage persistence
    usePacking.ts                              ← bag stats calculations
  data/
    bikes.json                                 ← 5 bike types + frame bag volumes
    events.json                                ← 5 BAS events + 5 generic types
    bags.json                                  ← legacy bag presets
    bags-bike24.json                           ← curated bag catalogue (current)
    items.json                                 ← gear catalogue with preferredBag
  utils/
    validation.ts                              ← warnings + messages
    url-state.ts                               ← serialize state to share URL
```

---

## 5. Open questions per BAS (oltre al designer)

- Conferma URL eventi (3.7).
- Curatela del catalogo borse: oggi è importato da Bike24, vogliamo filtrare/riordinare lo storefront?
- Sponsor placement: dove dovrebbero comparire i brand partner? (oggi è solo `basDiscount` nel preset bag, non c'è ancora un layout dedicato)
- Versione italiana del tool: pianificata o no-go per ora?

---

## 6. Come provare il branch

```bash
git checkout claude/improve-ux-event-participation-kMe0d
npm install
npm run dev
```

URL test con setup pre-compilato (Tuscany Trail Smart-packed):
1. Aprire `http://localhost:5173`
2. Cliccare "Tuscany Trail" sotto Quick start
3. Si arriva su Step 4 con bici/evento/borse/essentials già impostati
4. Continue → Step 5 (Results)
5. Continue → Step 6 (Share, con CTA "Sign up for Tuscany Trail")

Per testare resume: completare un paio di step, ricaricare la pagina — il wizard riprende esattamente da dove si era lasciato. "Start over" nell'header pulisce tutto.
