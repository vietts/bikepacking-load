# Bike Load Simulator — Knowledge Base per Claude Code

> Questo file raccoglie tutte le informazioni di contesto dal progetto Bike Adventure Series (BAS)
> necessarie per sviluppare il simulatore di carico bici. Usalo come reference primaria.

---

## 1. Cos'è BAS e perché questo tool

Bike Adventure Series organizza eventi di bikepacking e gravel cycling **no-race** in Europa e Patagonia.
Il pubblico è composto da ciclisti amatoriali (30-50 anni), spesso alla **prima esperienza di bikepacking**.
La loro paura principale non è la fatica — è **non sapere cosa portare e come organizzarlo**.

Il simulatore di carico bici serve a:
1. **Aiutare i partecipanti** a capire cosa mettere nelle borse, quanto pesa, quanto spazio occupa, e come distribuire il carico
2. **Essere un lead magnet** — uno strumento gratuito che attira traffico e genera contatti email
3. **Integrare sponsor** — i brand di borse, accessori e gear possono essere raccomandati nel tool

### Positioning del tool
- NON è un tool tecnico per nerd del ciclismo
- È un tool **rassicurante** per chi non ha mai fatto bikepacking
- Tono: amico esperto che ti aiuta, non manuale tecnico
- Deve abbassare la barriera d'ingresso, non alzarla

---

## 2. Target Audience (dai dati BAS)

- **Età**: 30-50 anni (core)
- **Esperienza**: prima volta o limitata nel bikepacking
- **Bici**: gravel o road bike, livello amatoriale, NO power meter
- **Provenienza**: 60% internazionale, 40% italiano, 33+ paesi
- **Ciclo di acquisto**: 140 giorni medi dal primo contatto alla registrazione
- **Mindset**: cercano esperienza, non performance. Hanno paura di "non essere pronti"

### Le 3 obiezioni principali dei partecipanti
1. "Non sono abbastanza allenato" → il tool li rassicura mostrando che non serve portare troppo
2. "Non so cosa portare" → il tool risponde direttamente a questa domanda
3. "Non conosco nessuno" → non direttamente legata al tool, ma il tool può creare community (condivisione setup)

---

## 3. Eventi BAS — Dati per calibrare il simulatore

Il simulatore deve poter raccomandare setup diversi in base al tipo di evento.

### The Grand Escape Series (road bikepacking, asfalto 100%)
- **Distanza**: ~550 km
- **Durata**: 3-5 giorni (finestra flessibile, nessuna tappa fissa)
- **Superficie**: 100% asfalto, piste ciclabili, strade secondarie
- **Edizioni**: Germania/Austria, Italia/Slovenia, altre in arrivo
- **Partecipanti**: 350-500 per evento
- **Difficoltà percepita**: media-bassa (ma i partecipanti pensano sia alta)
- **Setup tipico**: borse leggere, poco gear tecnico, no tenda obbligatoria

### Tuscany Trail (gravel, off-road)
- **Distanza**: ~440 km
- **Durata**: variabile (self-paced)
- **Superficie**: mix gravel e asfalto, strade bianche toscane
- **Partecipanti**: 6.100 (il più grande evento gravel al mondo)
- **Difficoltà**: media
- **Setup tipico**: setup gravel completo, possibile bivacco

### NorthCape4000 (ultracycling)
- **Distanza**: ~4.000 km (Italia → Capo Nord)
- **Durata**: variabile (self-paced, settimane)
- **Superficie**: prevalentemente asfalto
- **Partecipanti**: 500
- **Difficoltà**: alta (endurance estrema)
- **Setup tipico**: ultra-leggero, massima efficienza, gear per ogni condizione meteo

### Final Frontier Patagonia (gravel expedition)
- **Distanza**: ~2.700 km
- **Superficie**: gravel patagonico
- **Difficoltà**: molto alta (remote, autosufficienza)
- **Setup tipico**: expedition-grade, autosufficienza completa

### Unpaved Roads (weekend events)
- **Distanza**: breve (1-2 giorni)
- **Superficie**: gravel
- **Setup tipico**: minimale, quasi da day-ride

---

## 4. Modello dati: Bici

### Categorie bici supportate
Il simulatore deve gestire almeno queste categorie:

1. **Road bike** — geometria corsa, attacchi limitati per borse
2. **Gravel bike** — la più comune tra i partecipanti BAS, attacchi multipli
3. **Touring bike** — portapacchi anteriore e posteriore, massima capacità
4. **Mountain bike (hardtail)** — usata da alcuni al Tuscany Trail
5. **Mountain bike (full suspension)** — rara ma presente

### Taglie standard
Le taglie influenzano lo spazio disponibile nel triangolo del telaio (frame bag):
- XS (< 50 cm)
- S (50-52 cm)
- M (54-56 cm)
- L (56-58 cm)
- XL (> 58 cm)

### Peso bici a vuoto (riferimenti medi)
- Road: 7-9 kg
- Gravel: 8-11 kg
- Touring: 12-15 kg
- MTB hardtail: 10-13 kg
- MTB full: 12-15 kg

---

## 5. Modello dati: Borse bikepacking

### Tipologie di borse e posizioni

#### Handlebar bag / roll (manubrio)
- **Posizione**: manubrio, davanti
- **Volume tipico**: 8-15 litri
- **Peso max raccomandato**: 3-5 kg
- **Cosa metterci**: oggetti leggeri e voluminosi (sacco a pelo, vestiti, piumino)
- **Impatto sulla guida**: influenza lo sterzo se troppo pesante
- **Brand comuni**: Apidura, Restrap, Ortlieb, Topeak, Miss Grape, Rockbros

#### Frame bag (borsa da telaio)
- **Posizione**: triangolo del telaio
- **Volume tipico**: 3-8 litri (dipende dalla taglia bici)
- **Peso max raccomandato**: 3-5 kg
- **Cosa metterci**: oggetti pesanti e compatti (attrezzi, cibo, batterie, kit riparazione)
- **Impatto sulla guida**: il migliore — baricentro basso e centrato
- **Note**: il volume dipende molto dalla taglia del telaio. Full-frame vs half-frame.

#### Saddle bag / seat pack (sottosella)
- **Posizione**: sotto la sella, posteriore
- **Volume tipico**: 8-16 litri
- **Peso max raccomandato**: 3-5 kg
- **Cosa metterci**: vestiti, attrezzatura campo, oggetti che non servono durante il giorno
- **Impatto sulla guida**: se troppo pesante oscilla e influenza il bilanciamento
- **Note**: più grande = più oscillazione. Meglio non superare 4-5 kg.

#### Top tube bag (borsa sul tubo orizzontale)
- **Posizione**: tubo orizzontale, davanti al ciclista
- **Volume tipico**: 0.5-1.5 litri
- **Peso max raccomandato**: 0.5-1 kg
- **Cosa metterci**: snack, telefono, batteria, oggetti ad accesso rapido
- **Impatto sulla guida**: minimo

#### Fork bags / cargo cages (forcella)
- **Posizione**: lati della forcella anteriore
- **Volume tipico**: 1-5 litri per lato (con borsa dry bag)
- **Peso max raccomandato**: 1.5-2 kg per lato
- **Cosa metterci**: acqua, cibo, attrezzi pesanti
- **Impatto sulla guida**: abbassa il baricentro anteriore, buono per stabilità
- **Note**: servono attacchi sulla forcella (cage mounts). Non tutte le bici li hanno.

#### Rear rack + panniers (portapacchi posteriore — solo touring)
- **Posizione**: posteriore, ai lati della ruota
- **Volume tipico**: 20-40 litri per lato
- **Peso max raccomandato**: 10-15 kg per lato
- **Cosa metterci**: tutto — è il setup da touring classico
- **Impatto sulla guida**: peso posteriore elevato, bici meno agile
- **Note**: NON tipico per il target BAS. Menzionare solo per touring bike.

### Peso totale carico — linee guida

| Tipo evento | Peso carico raccomandato | Peso max accettabile |
|---|---|---|
| Weekend (Unpaved Roads) | 3-5 kg | 7 kg |
| Road bikepacking 3-5 giorni (TGE) | 5-8 kg | 12 kg |
| Gravel multi-day (TT) | 7-10 kg | 15 kg |
| Ultracycling (NC4000) | 5-8 kg | 10 kg |
| Expedition (FFP) | 10-15 kg | 20 kg |

---

## 6. Modello dati: Oggetti da portare

### Categorie oggetti

#### Vestiti e protezione meteo
| Oggetto | Peso (g) | Volume (L) | Priorità | Note |
|---|---|---|---|---|
| Giacca antipioggia | 150-300 | 0.5-1.0 | ESSENZIALE | Sempre, anche d'estate |
| Gilet antivento | 80-120 | 0.2-0.3 | ESSENZIALE | Discese lunghe |
| Pantaloncini ciclismo (ricambio) | 150-200 | 0.3 | ALTA | Igiene multi-day |
| Maglia ciclismo (ricambio) | 120-180 | 0.3 | ALTA | |
| Intimo ricambio | 50-80 | 0.1 | ALTA | Merino consigliato |
| Calzini ricambio | 30-50 | 0.1 | ALTA | Merino consigliato |
| Manicotti/gambali | 80-120 | 0.2 | MEDIA | Versatilità termica |
| Pile/maglia termica | 200-350 | 0.5-1.0 | MEDIA | Per serate/altitudine |
| Pantaloni lunghi casual | 200-300 | 0.5 | BASSA | Per serate in paese |
| Maglietta casual | 120-180 | 0.3 | BASSA | |
| Cappello/buff | 30-50 | 0.1 | MEDIA | Multi-uso |
| Guanti lunghi | 50-100 | 0.1 | MEDIA | Per pioggia/freddo |
| Copriscarpe | 100-200 | 0.3 | BASSA | Solo se pioggia prevista |

#### Dormire
| Oggetto | Peso (g) | Volume (L) | Priorità | Note |
|---|---|---|---|---|
| Sacco a pelo leggero (comfort 10°C) | 500-800 | 2-4 | CONDIZIONALE | Se bivacco/camping |
| Materassino gonfiabile | 300-500 | 0.8-1.5 | CONDIZIONALE | Se bivacco |
| Tenda ultraleggera (1p) | 800-1500 | 2-4 | CONDIZIONALE | Se bivacco |
| Tarp/bivy bag | 200-500 | 0.5-1.5 | CONDIZIONALE | Alternativa tenda |
| Cuscino gonfiabile | 50-80 | 0.2 | BASSA | Lusso leggero |

#### Tech e navigazione
| Oggetto | Peso (g) | Volume (L) | Priorità | Note |
|---|---|---|---|---|
| GPS/ciclocomputer | 80-130 | 0.1 | ESSENZIALE | Con file GPX evento |
| Smartphone | 170-220 | 0.1 | ESSENZIALE | Backup navigazione |
| Powerbank 10000mAh | 180-250 | 0.2 | ESSENZIALE | |
| Powerbank 20000mAh | 350-500 | 0.3 | ALTA | Per eventi lunghi |
| Cavi ricarica | 30-50 | 0.1 | ESSENZIALE | |
| Luci anteriore + posteriore | 80-200 | 0.2 | ESSENZIALE | Sicurezza |
| Luce extra (backup) | 50-100 | 0.1 | MEDIA | Per NC4000 essenziale |

#### Riparazione e manutenzione
| Oggetto | Peso (g) | Volume (L) | Priorità | Note |
|---|---|---|---|---|
| Multitool bici | 150-250 | 0.1 | ESSENZIALE | |
| Camera d'aria di ricambio (x2) | 150-250 | 0.2 | ESSENZIALE | O tubeless kit |
| Kit riparazione tubeless | 50-80 | 0.05 | ESSENZIALE | Se tubeless |
| Pompa mini / CO2 | 80-150 | 0.1-0.2 | ESSENZIALE | |
| Catena maglie rapide (x2) | 10-20 | 0.01 | ALTA | |
| Nastro isolante (piccolo rotolo) | 20 | 0.02 | MEDIA | Multi-uso riparazioni |
| Fascette | 10 | 0.01 | MEDIA | Riparazioni emergenza |

#### Igiene
| Oggetto | Peso (g) | Volume (L) | Priorità | Note |
|---|---|---|---|---|
| Spazzolino + dentifricio mini | 30-50 | 0.05 | ALTA | |
| Sapone biodegradabile mini | 30-50 | 0.05 | MEDIA | |
| Crema solare | 50-80 | 0.05 | ALTA | |
| Crema camoscio | 50-80 | 0.05 | ALTA | Anti-irritazione |
| Salviette umidificate | 30-50 | 0.05 | MEDIA | |
| Asciugamano microfibra | 50-100 | 0.2 | MEDIA | |
| Kit primo soccorso mini | 50-100 | 0.1 | ALTA | Cerotti, ibuprofene, antistaminico |

#### Alimentazione e idratazione
| Oggetto | Peso (g) | Volume (L) | Priorità | Note |
|---|---|---|---|---|
| Borracce (x2, 750ml) | 150-200 | (sul telaio) | ESSENZIALE | Spazio nel frame |
| Barrette/gel (scorta giornaliera) | 200-400 | 0.3-0.5 | ESSENZIALE | Variabile |
| Elettroliti | 30-50 | 0.05 | ALTA | |
| Fornelletto + gas (ultraleggero) | 200-350 | 0.5 | CONDIZIONALE | Solo expedition |
| Tazza/pentolino | 80-150 | 0.3 | CONDIZIONALE | Solo expedition |

#### Documenti e varie
| Oggetto | Peso (g) | Volume (L) | Priorità | Note |
|---|---|---|---|---|
| Documento identità | 10 | 0.01 | ESSENZIALE | |
| Carta di credito/contanti | 10 | 0.01 | ESSENZIALE | |
| Tessera sanitaria | 5 | 0.01 | ESSENZIALE | |
| Lucchetto bici (leggero) | 50-150 | 0.1 | MEDIA | Per soste |

---

## 7. Regole di distribuzione del carico (logica del simulatore)

### Principio fondamentale
**Il peso più pesante deve stare più in basso e più al centro della bici.**

### Ordine di priorità posizionamento
1. **Frame bag** → oggetti pesanti e compatti (attrezzi, batterie, cibo denso)
2. **Fork cages** → acqua, oggetti pesanti (se disponibili)
3. **Saddle bag** → vestiti, sacco a pelo, oggetti leggeri e voluminosi
4. **Handlebar bag** → sacco a pelo, piumino, vestiti — leggeri e voluminosi
5. **Top tube bag** → snack, telefono, quick access items

### Regole di validazione
- Se peso totale > peso max raccomandato per tipo evento → WARNING "Troppa roba"
- Se handlebar bag > 5 kg → WARNING "Sterzo instabile"
- Se saddle bag > 5 kg → WARNING "Oscillazione sella"
- Se distribuzione > 60% posteriore → WARNING "Bici sbilanciata"
- Se mancano oggetti ESSENZIALI → WARNING "Ti manca [oggetto]"
- Se oggetti CONDIZIONALI presenti ma non necessari per evento → SUGGERIMENTO "Potresti lasciare a casa [oggetto]"

### Raccomandazioni per tipo evento BAS

#### The Grand Escape (road, 3-5 giorni, hotel/B&B disponibili)
- NO tenda/sacco a pelo (ci sono strutture lungo il percorso)
- Setup leggero: handlebar + frame + saddle bag bastano
- Focus su vestiti ricambio, antipioggia, tech
- "Per The Grand Escape non ti serve la tenda — ci sono B&B e hotel lungo tutto il percorso"

#### Tuscany Trail (gravel, bivacco possibile)
- Sacco a pelo consigliato
- Più vestiti perché off-road = più sporco
- Kit riparazione più completo (gravel è più duro sui copertoni)
- "Al Tuscany Trail molti bivaccano — un sacco a pelo leggero fa la differenza"

#### NorthCape4000 (ultra, settimane)
- Setup ultra-leggero ma per tutte le condizioni meteo
- Powerbank grande, luci extra (notti nordiche variabili)
- Vestiti per freddo intenso
- "Al NorthCape4000 ogni grammo conta — ma il meteo cambia 10 volte al giorno"

---

## 8. Opportunità sponsor e brand integration

### Come il tool può integrare gli sponsor
1. **Raccomandazioni prodotto** — quando l'utente seleziona "handlebar bag", il tool può mostrare modelli specifici di brand partner
2. **"Consigliato da BAS"** — badge su prodotti testati dal team
3. **Link affiliati** — ogni prodotto raccomandato può avere un link d'acquisto
4. **Brand nella lista oggetti** — es. "Giacca antipioggia — come la Patagonia Houdini (partner BAS)"
5. **Setup consigliati** — "Il setup usato da Francesco al NC4000" con tutti prodotti linkati
6. **Comparazione borse** — i brand sponsor possono avere visibilità nella selezione borse

### Brand rilevanti nel mondo bikepacking
- **Borse**: Apidura, Restrap, Ortlieb, Miss Grape, Topeak, Rockbros, Tailfin
- **Abbigliamento**: Pas Normal Studios, Rapha, Castelli, MAAP, 7mesh
- **Accessori**: Garmin, Wahoo, Lezyne, Topeak, SKS
- **Camping**: Sea to Summit, Therm-a-Rest, Big Agnes, MSR
- **Nutrizione**: Maurten, SiS, Namedsport, Enervit

### Dati BAS utili per pitch sponsor
- 33+ paesi rappresentati
- 8.000+ partecipanti totali annuali
- Reach organico: 3M (Tuscany Trail), 1.5M (NC4000)
- 98% satisfaction rate
- Target alto-spendente (compra gear premium)
- Contenuti YouTube con 1M+ views da partecipanti

---

## 9. Brand voice per il tool (dal brand BAS)

### Tono
- **Amico esperto**, non manuale tecnico
- **Rassicurante**, non intimidatorio
- Conversazionale, semplice, diretto
- "Non ti preoccupare, è più semplice di quello che pensi"

### Messaggi chiave nel tool
- "Meno è meglio" — bikepacking non è portarsi la casa dietro
- "Il peso che non porti è il peso che non senti"
- "Per [evento X] non ti serve portare [Y]" — raccomandazioni contestuali
- "Il setup perfetto non esiste — esiste il tuo setup"

### Cosa evitare
- Linguaggio tecnico eccessivo (no "rapporto peso/volume ottimale")
- Tono competitivo (no "setup pro", "setup da gara")
- Pressione (no "DEVI portare questo")
- Cliché marketing (no "il must-have definitivo")

### Lingua
- Tool in **inglese** (audience 60% internazionale)
- Possibile versione italiana futura
- Unità di misura: grammi (peso), litri (volume), kg (peso totale)

---

## 10. Note tecniche per lo sviluppo

### Flusso utente immaginato
1. Scegli tipo di bici (road/gravel/touring/MTB)
2. Scegli taglia (XS-XL) → calcola volume frame bag disponibile
3. Scegli tipo di evento o durata viaggio
4. Scegli set di borse (handlebar, frame, saddle, top tube, fork cages)
5. Aggiungi oggetti dalla lista (con pesi e volumi pre-compilati)
6. Il sistema distribuisce automaticamente nelle borse (o l'utente può fare drag&drop)
7. Dashboard: peso totale, distribuzione %, warnings, suggerimenti
8. Output: lista finale stampabile/condivisibile + raccomandazioni BAS

### Problemi noti da risolvere
- **Volume**: il calcolo è approssimativo. I volumi degli oggetti compressi (sacco a pelo, vestiti) variano molto. Usare range e medie.
- **Modelli bici specifici**: iniziare con categorie generiche, non modelli specifici. Il database di tutti i modelli è irrealistico per un MVP.
- **Borse specifiche**: stessa cosa — iniziare con tipologie e volumi generici, poi eventualmente aggiungere modelli specifici dei brand partner.

### Stack suggerito
- React (JSX) per il frontend — compatibile con l'ambiente BAS
- Dati in JSON (oggetti, borse, bici)
- Nessun backend necessario per MVP — tutto client-side
- Possibile embed su sito BAS (WordPress)

---

## 11. Fonti di questi dati

- `brand-guidelines.md` — brand voice e positioning BAS
- `target-audience.md` — profilo audience e obiezioni
- `newsletter-examples.md` — tono comunicazione
- `angoli-newsletter.md` — angoli content (gear list è uno degli angoli più richiesti)
- `dati-reali-2025.md` — numeri eventi reali
- `template-comunicazioni.md` — template sponsor e fornitori
- Conoscenza diretta di Francesco (CEO BAS) sul bikepacking e gli eventi
- Knowledge base generale bikepacking (pesi, volumi, best practices distribuzione carico)
