# ticketing-app

YouTicket: applicazione **server-side** unica — **Node.js + Express + EJS + TypeScript + PostgreSQL** (via Prisma ORM), con chat in tempo reale via **socket.io**.

Le pagine sono renderizzate dal server con EJS (niente frontend separato). L'autenticazione usa **express-session**; le password sono hashate con **bcrypt**.

---

## Prerequisiti

- Node.js 18 o superiore
- Un'istanza PostgreSQL raggiungibile (locale o Docker)

---

## Setup iniziale

```bash
cd ticketing-app
npm install
```

Crea il file `.env` a partire dall'esempio:

```bash
cp .env.example .env
```

Poi apri `.env` e aggiusta i valori:

```env
PORT=8080
DATABASE_URL=postgresql://postgres:password@localhost:5432/ticketdb
SESSION_SECRET=una-stringa-segreta
```

---

## Database e schema

Lo schema Prisma è in `prisma/schema.prisma`. Al primo avvio l'app inizializza il database e inserisce 4 categorie di default se la tabella è vuota.

```bash
npx prisma db push    # sincronizza lo schema Prisma col database
npm run db:studio     # apre Prisma Studio (UI per ispezionare il DB)
npm run db:seed       # popola il DB con dati di esempio
```

---

## Avvio

**Sviluppo** (hot-reload via nodemon):

```bash
npm run dev
```

**Produzione:**

```bash
npm run build   # compila TypeScript → dist/
npm start       # avvia da dist/index.js
```

L'app risponde su `http://localhost:8080`. Lo stesso server serve pagine, l'endpoint di download allegati e la chat socket.io.

**Con Docker** (dalla root del repo): `docker compose up --build` avvia PostgreSQL + l'app.

---

## Sessione: due ruoli nello stesso browser

La sessione è identificata da un parametro `sid` nella **URL**, non dal cookie del browser. Così due finestre/tab dello stesso browser (che condividono il cookie) restano **sessioni distinte**: puoi essere loggato come UTENTE in una e come TECNICO in un'altra contemporaneamente.

Per avere un secondo ruolo apri `http://localhost:8080` in una nuova finestra/tab (senza `sid`) e fai login: quel tab ottiene il suo `sid` e resta indipendente.

> Nota: il `sid` è visibile nella URL (ok per progetto/localhost, meno per un sistema reale dove si userebbe un cookie `httpOnly`).

---

## Come è strutturato

```
src/
  index.ts                 → avvio Express, EJS, sessione (sid in URL), socket.io, errori
  config/
    db.ts                  → client Prisma e creazione categorie iniziali (bootstrapDb)
  routes/                  → solo wiring (route → controller), divise per dominio
    pagine.routes.ts       → aggregatore route pagine (accesso + dashboard + ticket)
    accesso.routes.ts      → login, registrazione, logout
    dashboard.routes.ts    → dashboard, auto-assegnazione
    ticket.routes.ts       → nuova richiesta, dettaglio, azioni
    index.ts               → aggrega le route REST sotto /api
    allegati.routes.ts     → API REST: download allegato (montata sotto /api/tickets)
  controllers/             → orchestrazione HTTP (try/catch, sessione, flash, render)
    accesso.controller.ts  → login / registrazione / logout
    dashboard.controller.ts → dashboard + auto-assegnazione
    ticket.controller.ts   → nuova richiesta, dettaglio, azioni (stato, priorità, commenti, ...)
    allegati.controller.ts → scaricaAllegato (download)
  services/
    auth.service.ts        → logica di business e query Prisma (auth)
    categorie.service.ts
    tickets.service.ts
  schemas/
    auth.schema.ts         → validazione input con Zod
  middlewares/
    asyncHandler.ts        → wrapper che cattura gli errori asincroni
    autenticazione.ts      → requireAuth: protegge le pagine (redirect a /login)
    caricamentoFile.ts     → multer per l'upload degli allegati (multipart)
  errors/
    ApiError.ts            → errore applicativo con status code
    errorHandler.ts        → middleware globale di gestione errori (per le route REST)
    messaggioErrore.ts     → estrae il messaggio leggibile mostrato nelle pagine
  types/
    sessione.d.ts          → estende la sessione con utente loggato e flash
  websocket-server.ts      → server socket.io per i commenti in tempo reale
views/
  pagine/                  → login, dashboard, nuovo-ticket, ticket (EJS)
  partials/                → intestazione, navbar, notifica (flash), chiusura
public/                    → css e logo
```

Il flusso è: **route (wiring) → controller (orchestrazione HTTP) → service (logica + Prisma)**. Route e controller sono divisi per dominio (accesso, dashboard, ticket) per evitare un file unico troppo grande; i controller leggono richiesta/sessione, chiamano i service e renderizzano una vista EJS o fanno redirect (pattern POST→redirect). La validazione input è con Zod (`schemas/`).

---

## Endpoint HTTP

Quasi tutta la logica passa dalle pagine. Restano esposti:

| Metodo | Path | Cosa fa |
|--------|------|---------|
| `GET` | `/health` | Health check, risponde `{ "ok": true }` |
| `GET` | `/api/tickets/:id/allegati/:allegatoId/download` | Scarica un allegato |

Oltre all'HTTP, l'app espone un server **socket.io** sullo stesso host e porta: alla connessione il client indica quale ticket sta seguendo (`join`) e riceve in tempo reale i nuovi commenti di quella conversazione.

---

## Limitazioni di sicurezza (importante)

Progetto universitario, non pensato per la produzione.

- Le **password sono hashate con bcrypt**.
- L'identità delle azioni viene presa dalla **sessione** (`req.session.user`), non dal body: non si può più impersonare un altro utente passando lo username.
- Il `sid` di sessione viaggia nella **URL**: comodo per testare due ruoli nello stesso browser, ma intercettabile (cronologia, referer). In un sistema reale si userebbe un cookie `httpOnly`.
