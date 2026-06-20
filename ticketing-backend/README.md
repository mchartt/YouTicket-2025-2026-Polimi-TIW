# ticketing-backend

Backend di YouTicket: **Node.js + Express + TypeScript + PostgreSQL** (via Prisma ORM).

Le API sono sotto `/api/auth`, `/api/categorie` e `/api/tickets`.

---

## Prerequisiti

- Node.js 18 o superiore
- Un'istanza PostgreSQL raggiungibile (locale o Docker)

---

## Setup iniziale

```bash
cd ticketing-backend
npm install
```

Crea il file `.env` a partire dall'esempio:

```bash
cp .env.example .env
```

Poi apri `.env` e aggiusta `DATABASE_URL` con i tuoi dati:

```env
PORT=8080
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:4200
DATABASE_URL=postgresql://postgres:password@localhost:5432/ticketdb
```

---

## Database e schema

Lo schema Prisma è in `prisma/schema.prisma`. Al primo avvio il backend inizializza il database e inserisce 4 categorie di default se la tabella è vuota.

Comandi utili:

```bash
npx prisma db push    # sincronizza lo schema Prisma col database
npm run db:generate   # rigenera il client Prisma dopo modifiche allo schema
npm run db:studio     # apre Prisma Studio (UI per ispezionare il DB)
```

---

## Avvio

**Sviluppo** (con hot-reload via nodemon):

```bash
npm run dev
```

**Produzione:**

```bash
npm run build   # compila TypeScript → dist/
npm start       # avvia da dist/index.js
```

Il server risponde su `http://localhost:8080` per default.

---

## Come è strutturato

Il codice è organizzato per dominio (auth, categorie, tickets), con i vari livelli separati in cartelle:

```
src/
  index.ts                 → avvio di Express, CORS, middleware globali e gestione errori
  config/
    db.ts                  → client Prisma e creazione delle categorie iniziali (bootstrapDb)
  routes/
    index.ts               → aggrega le route e le monta sotto /auth, /categorie, /tickets
    auth.routes.ts         → route del dominio auth
    categorie.routes.ts    → route del dominio categorie
    tickets.routes.ts      → route del dominio tickets
  controllers/
    auth.controller.ts     → leggono la richiesta e chiamano i service
    categorie.controller.ts
    tickets.controller.ts
  services/
    auth.service.ts        → logica di business e query con Prisma
    categorie.service.ts
    tickets.service.ts
  schemas/
    auth.schema.ts         → validazione input con Zod
  middlewares/
    asyncHandler.ts        → wrapper che cattura gli errori asincroni
  errors/
    ApiError.ts            → errore applicativo con status code
    errorHandler.ts        → middleware globale di gestione errori
```

Il flusso di una richiesta è: **route → controller → service**. Le route sono avvolte in `asyncHandler` per intercettare gli errori asincroni, i controller leggono la richiesta e delegano ai service, dove sta la logica di business e le query Prisma. La validazione degli input è fatta con Zod (`schemas/`).

---

## Endpoint esposti

Tutte le route sono montate sotto `/api`. Oltre a queste c'è `GET /health` che risponde `{ "ok": true }`.

**Auth — `/api/auth`**

| Metodo | Path | Cosa fa |
|--------|------|---------|
| `POST` | `/register` | Registrazione utente o tecnico |
| `GET` | `/preview-username` | Anteprima dello username generato automaticamente |
| `POST` | `/login` | Login |
| `PATCH` | `/auto-assegnazione` | Attiva/disattiva l'auto-assegnazione per un tecnico |

**Categorie — `/api/categorie`**

| Metodo | Path | Cosa fa |
|--------|------|---------|
| `GET` | `/` | Elenco categorie (`?attive=true` per le sole attive) |
| `POST` | `/` | Crea una categoria |
| `PATCH` | `/:id/attivo` | Attiva/disattiva una categoria |
| `DELETE` | `/:id` | Elimina una categoria |

**Tickets — `/api/tickets`**

| Metodo | Path | Cosa fa |
|--------|------|---------|
| `GET` | `/search` | Lista ticket con filtri (`categoria`, `stato`, `priorita`, `tecnico`, `autore`) |
| `GET` | `/stats/feedback` | Statistiche dei feedback |
| `GET` | `/:id/allegati/:allegatoId/download` | Scarica un allegato |
| `GET` | `/:id` | Dettaglio di un ticket |
| `POST` | `/` | Crea un ticket (risponde 201) |
| `PATCH` | `/:id/priorita` | Cambia la priorità |
| `PATCH` | `/:id/stato` | Cambia lo stato |
| `PATCH` | `/:id/assegna` | Presa in carico / assegnazione |
| `PATCH` | `/:id/archivia` | Archivia un ticket |
| `PATCH` | `/:id` | Modifica titolo, descrizione e categoria |
| `POST` | `/:id/commenti` | Aggiunge un commento (notificato in tempo reale via WebSocket) |
| `POST` | `/:id/allegati` | Aggiunge un allegato |
| `DELETE` | `/:id/allegati/:allegatoId` | Elimina un allegato |
| `POST` | `/:id/feedback` | Invia un feedback |

Oltre alle route HTTP, il backend espone un server WebSocket sullo stesso host e porta: alla connessione il client indica quale ticket sta seguendo e riceve in tempo reale i nuovi commenti di quella conversazione.

---

## Comportamento delle API

- Gli errori restituiscono sempre `{ "error": "messaggio leggibile" }` nel body.
- Il login fallito risponde con un errore nel solito formato `{ "error": "..." }` (non viene creato nessun token o sessione).
- `POST /api/tickets` risponde **201** con il ticket appena creato.
- `GET /api/tickets/search` accetta query params: `categoria`, `stato`, `priorita`, `tecnico`, `autore`.

---

## Limitazioni di sicurezza (importante)

Questo backend è pensato per un corso universitario, non per il business ovviamente.

Sicurezza utilizzata:

- Le **password sono hashate con bcrypt**.

Alcune cose che mancano rispetto a un sistema reale:

- **Nessuna autenticazione basata su token**: le azioni che richiedono un utente specifico (es. chi prende in carico un ticket) ricevono lo username nel body della richiesta. Non c'è verifica crittografica dell'identità — chiunque raggiunga gli endpoint può impersonare qualsiasi utente.

- Il **CORS** in sviluppo è limitato a `localhost:4200`. Con `CORS_ORIGIN=*` si apre a tutti (solo per test locali).

Per un sistema reale servirebbero JWT o sessioni server-side con cookie `httpOnly`.
