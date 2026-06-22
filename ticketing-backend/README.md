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

Poi apri `.env` e aggiusta i valori con i tuoi dati:

```env
PORT=8080
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:4200
DATABASE_URL=postgresql://postgres:password@localhost:5432/ticketdb
JWT_SECRET=                 # obbligatorio: una stringa lunga e casuale per firmare i token
```

`JWT_SECRET` è **obbligatorio**: se manca, il backend si rifiuta di partire (così non si firmano token con un secret noto).

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

## Avvio con Docker (stack completo)

Nella **root del progetto** c'è un `docker-compose.yml` che avvia l'intero stack — database, backend e frontend — con un solo comando:

```bash
docker compose up -d --build
```

- `db` → PostgreSQL sulla porta `5432` (dati persistiti nel volume `db_data`)
- `backend` → API su `http://localhost:8080` (all'avvio esegue `prisma db push` e poi parte)
- `frontend` → app su `http://localhost`

Il `JWT_SECRET` del backend è impostato fra le `environment` del servizio nel compose. Per fermare tutto: `docker compose down` (i dati restano), oppure `docker compose down -v` per azzerare anche il volume del database.

Dati demo opzionali (utenti e ticket di esempio, password `Password123!`):

```bash
cd ticketing-backend && npm run db:seed
```

---

## Come è strutturato

Il codice è organizzato per dominio (auth, categorie, tickets), con i vari livelli separati in cartelle:

```
src/
  index.ts                 → avvio di Express, CORS, middleware globali e gestione errori
  websocket-server.ts      → server Socket.IO per i commenti in tempo reale
  config/
    db.ts                  → client Prisma e creazione delle categorie iniziali (bootstrapDb)
  routes/
    index.routes.ts               → aggrega le route e le monta sotto /auth, /categorie, /tickets
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
    requireAuth.ts         → verifica il token JWT (requireAuth) e il ruolo (requireRole)
  errors/
    ApiError.ts            → errore applicativo con status code
    errorHandler.ts        → middleware globale di gestione errori
```

Il flusso di una richiesta è: **route → controller → service**. Le route sono avvolte in `asyncHandler` per intercettare gli errori asincroni, i controller leggono la richiesta e delegano ai service, dove sta la logica di business e le query Prisma. La validazione degli input è fatta con Zod (`schemas/`).

---

## Autenticazione e autorizzazione

Login e registrazione restituiscono un **token JWT** (firmato con `JWT_SECRET`, valido 7 giorni) che contiene `id`, `username` e `ruolo`. Tutte le altre route richiedono il token nell'header:

```http
Authorization: Bearer <token>
```

Il middleware `requireAuth` verifica il token e mette i dati dell'utente in `req.user`; `requireRole("TECNICO")` limita una route ai soli tecnici. **L'identità non si prende mai dal body**: chi è l'autore di un ticket, chi lo prende in carico o chi commenta è sempre l'utente del token.

Nelle tabelle sotto: 🔑 = richiede il token, 🔧 = riservata ai tecnici.

---

## Endpoint esposti

Tutte le route sono montate sotto `/api`. Oltre a queste c'è `GET /health` (pubblica) che risponde `{ "ok": true }`.

**Auth — `/api/auth`**

| Metodo | Path | Auth | Cosa fa |
|--------|------|------|---------|
| `POST` | `/register` | — | Registrazione utente o tecnico (ritorna token) |
| `POST` | `/login` | — | Login (ritorna token) |
| `PATCH` | `/auto-assegnazione` | 🔑 🔧 | Attiva/disattiva l'auto-assegnazione per il tecnico loggato |

**Categorie — `/api/categorie`**

| Metodo | Path | Auth | Cosa fa |
|--------|------|------|---------|
| `GET` | `/` | 🔑 | Elenco categorie |
| `POST` | `/` | 🔑 🔧 | Crea una categoria |
| `PATCH` | `/:id` | 🔑 🔧 | Rinomina una categoria |
| `DELETE` | `/:id` | 🔑 🔧 | Elimina una categoria (solo se tutti i suoi ticket sono risolti o non ne ha) |

**Tickets — `/api/tickets`**

| Metodo | Path | Auth | Cosa fa |
|--------|------|------|---------|
| `GET` | `/search` | 🔑 | Lista ticket con filtri (`categoria`, `stato`, `priorita`, `tecnico`, `autore`) |
| `GET` | `/stats/feedback` | 🔑 | Statistiche dei feedback |
| `GET` | `/:id/allegati/:allegatoId/download` | 🔑 | Scarica un allegato |
| `GET` | `/:id` | 🔑 | Dettaglio di un ticket |
| `POST` | `/` | 🔑 | Crea un ticket (risponde 201) |
| `PATCH` | `/:id/priorita` | 🔑 🔧 | Cambia la priorità |
| `PATCH` | `/:id/stato` | 🔑 🔧 | Cambia lo stato |
| `PATCH` | `/:id/assegna` | 🔑 🔧 | Presa in carico / assegnazione |
| `PATCH` | `/:id/archivia` | 🔑 | Archivia un ticket risolto |
| `PATCH` | `/:id` | 🔑 | Modifica titolo, descrizione e categoria (l'autore, entro 15 minuti) |
| `POST` | `/:id/commenti` | 🔑 | Aggiunge un commento (notificato in tempo reale via WebSocket) |
| `POST` | `/:id/allegati` | 🔑 | Aggiunge un allegato (max 3 per ticket) |
| `POST` | `/:id/feedback` | 🔑 | Invia un feedback a un ticket risolto |

Oltre alle route HTTP, il backend espone un server WebSocket sullo stesso host e porta: alla connessione il client indica quale ticket sta seguendo e riceve in tempo reale i nuovi commenti di quella conversazione.

### Allegati

I file caricati **non vengono salvati nel database**: il file fisico finisce su disco nella cartella `uploads/` (gestita da Multer), mentre nella tabella `allegati` vengono salvati solo i metadati (`nomeFile`, `tipo`, data) e il **percorso** del file nella colonna `dati`. Il download rilegge il file dal disco a partire da quel percorso.

---

## Comportamento delle API

- Gli errori restituiscono sempre `{ "error": "messaggio leggibile" }` nel body.
- Il login fallito risponde con un errore nel solito formato `{ "error": "..." }` (non viene creato nessun token o sessione).
- `POST /api/tickets` risponde **201** con il ticket appena creato.
- `GET /api/tickets/search` accetta query params: `categoria`, `stato`, `priorita`, `tecnico`, `autore`.

---

## Sicurezza

Questo backend è pensato per un corso universitario, ma adotta comunque alcune misure di base:

- Le **password sono hashate con bcrypt**.
- **Autenticazione con token JWT**: ogni route protetta richiede un `Bearer` token verificato lato server (algoritmo fissato a `HS256`). L'identità viene presa dal token, mai dal body, quindi non è possibile impersonare un altro utente passandone lo username.
- **Autorizzazione per ruolo**: le operazioni riservate (gestione categorie, cambio stato/priorità, presa in carico, auto-assegnazione) sono protette da `requireRole("TECNICO")`.
- `JWT_SECRET` è obbligatorio: senza, il backend non parte (niente secret di default hardcoded).

Limiti noti rispetto a un sistema di produzione:

- Il token è un JWT **stateless**: non c'è una blacklist, quindi non è revocabile prima della scadenza (7 giorni).
- Con `CORS_ORIGIN=*` le richieste sono aperte a qualsiasi origine (comodo per i test locali, da restringere in produzione).
- Gli allegati sono salvati sul filesystem locale del backend, non su uno storage dedicato.
