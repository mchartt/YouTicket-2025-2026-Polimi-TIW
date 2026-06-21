# YouTicket - Progetto TIW

Progetto per il corso di **TIW** (Tecnologie Informatiche per il Web) - Politecnico di Milano.

IMPORTANTE: Per effettuare un test rapido dell'applicazione loggatevi sul sito con le seguenti credenziali: 
1. TECNICO => tech.mario.rossi / password: password
2. UTENTE => mario.rossi / password: password

**Autore:** Cesandri Matteo (248170)

---

## Di cosa si tratta

YouTicket e' una piccola applicazione web per gestire ticket di supporto ed assistenza IT. L'idea e' semplice: c'e' chi apre una richiesta (l'utente) e chi la prende in carico e la risolve (il tecnico).

| Cartella | Cosa c'e' |
|----------|-----------|
| `ticketing-backend` | API REST - Node.js + Express + Prisma + PostgreSQL |
| `ticketing-frontend` | Interfaccia web - React + TypeScript + Vite + Bootstrap 5 |

- [README backend](ticketing-backend/README.md)
- [README frontend](ticketing-frontend/README.md)

---

## Cosa ti serve installato

- **Node.js** LTS e **npm**
- **PostgreSQL**, oppure **Docker** se vuoi avviare tutto con compose

```bash
node -v   # deve essere >= 18
npm -v
```

---

## Avvio rapido

**1) Backend**

```bash
cd ticketing-backend
npm install
cp .env.example .env   # configura DATABASE_URL con i tuoi dati Postgres
npx prisma db push
npm run dev
```

**2) Frontend**

```bash
cd ticketing-frontend
npm install
npm start
```

Apri il browser su **http://localhost:80**. Il backend gira su **http://localhost:8080**.

Se vuoi cambiare l'indirizzo del backend, imposta la variabile `VITE_API_BASE_URL` oppure cambia la costante `BASE` in `ticketing-frontend/src/services/api.ts`.

### Oppure con Docker Compose

```bash
docker-compose up --build
```

Fa partire tutto insieme: database PostgreSQL, backend e frontend.

---

## Build di produzione

```bash
# Backend
cd ticketing-backend
npm run build
npm start

# Frontend
cd ticketing-frontend
npm run build
```

---

## Struttura del repo

```text
YouTicket-2025-2026-Polimi-Project/
  ticketing-backend/     <- Node + Express + Prisma
  ticketing-frontend/    <- React + Vite
  docker-compose.yml
  ReadMe.md
```

---

## Funzionalita implementate

Le funzionalita sono divise per livello come da traccia. Il tick indica che la funzionalita e' completata.

### Livello 1: apertura e gestione ticket base

Utente:
- Registrazione e accesso ✓
- Apertura di un ticket con titolo, descrizione e categoria ✓
- Elenco dei propri ticket ✓
- Dettaglio di un ticket ✓
- Commenti sui propri ticket ✓
- Stato del ticket sempre visibile ✓

Tecnico:
- Visualizzazione di tutti i ticket ✓
- Risposta ai ticket tramite commenti ✓
- Modifica dello stato del ticket: aperto, preso in carico, in lavorazione, risolto, chiuso ✓

### Livello 2: priorita, assegnazione e filtri

- Priorita del ticket: bassa, media, alta, urgente ✓
- Assegnazione a uno specifico tecnico, con auto-assegnazione al tecnico con meno ticket attivi e presa in carico manuale ✓
- Storico delle modifiche di stato ✓
- Filtri per categoria, stato, priorita e tecnico assegnato ✓
- Dashboard tecnico con conteggi dei ticket aperti, in lavorazione e risolti ✓
- Valutazione della risoluzione da parte dell'utente con feedback da 1 a 5 sui ticket risolti o chiusi ✓

### Estensioni Livello 3: notifiche, real-time o knowledge base

- Aggiornamenti in tempo reale dei commenti tramite chat utente/tecnico su WebSocket ✓
- Caricamento di allegati ai ticket, con download ed eliminazione ✓
- Statistiche sui feedback ricevuti ✓
- Contaninerizzazione CI/CD ✓
- Deployment su Vercel/Railway ✓

I requisiti dei livelli 1 e 2 sono stati completati interamente.
Del livello 3 sono coperti gli aggiornamenti in tempo reale, gli allegati e le statistiche sui feedback.

### Funzionalita aggiuntive oltre la traccia

- Auto-assegnazione attivabile o disattivabile dal singolo tecnico ✓
- Modifica e archiviazione dei ticket ✓
- Validazione delle email per ruolo: @polimi.it per gli utenti, @service.polimi.it per i tecnici ✓
- Deploy con Docker Compose e pipeline CI ✓

---

## Note sul progetto

Per provare in fretta l'app puoi usare le credenziali di test scritte all'inizio di questo file. Per vedere liste, ticket e commenti serve comunque avere il backend avviato.

Per quanto riguarda la sicurezza: questo e' un progetto didattico, non è stato quindi implementato JWT. Le limitazioni principali sono documentate nel README del backend.
