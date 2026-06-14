# YouTicket - Progetto TIW

Progetto per il corso di **TIW** (Tecnologie Informatiche per il Web) - Politecnico di Milano.

IMPORTANTE: Per effettuare un test rapido dell'applicazione loggatevi sul sito con le seguenti credenziali: 
1. TECNICO => tech.mario.rossi / password: password
2. UTENTE => mario.rossi / password: password

**Autore:** Cesandri Matteo (248170)

---

## Di cosa si tratta

YouTicket e' una piccola applicazione web per gestire ticket di supporto IT. L'idea e' semplice: c'e' chi apre una richiesta (l'utente) e chi la prende in carico e la risolve (il tecnico).

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

**Utente:**
- Registrazione e login
- Apertura ticket con titolo, descrizione e categoria
- Visualizzazione dei propri ticket
- Dettaglio ticket con stato visibile
- Commenti sui propri ticket / Chat con il tecnico, aggiornata da sola mentre il ticket è aperto
- Feedback con voto 1-5 sui ticket risolti o chiusi

**Tecnico:**
- Registrazione e login
- Vista di tutti i ticket e coda dei ticket non assegnati
- Presa in carico manuale
- Assegnazione automatica al tecnico con meno ticket attivi
- Cambio stato: preso in carico, in lavorazione, risolto, chiuso
- Cambio priorita: bassa, media, alta, urgente
- Filtri per categoria, stato, priorita e tecnico assegnato
- Storico dei cambi stato nel dettaglio ticket
- Dashboard con conteggi ticket aperti, in lavorazione e risolti
- Gestione categorie
- Commenti sui propri ticket / Chat con l'utente, aggiornata da sola mentre il ticket è aperto

**Tutti i requisiti di livello 1 e 2 del progetto sono stati completati.**

**Funzionalità extra oltre la traccia per il livello 3:** 
1. chat real-time utente/tecnico
2. gestione categorie con attivazione/eliminazione
3. auto-assegnazione attivabile per tecnico
4. statistiche feedback (getStatsFeedback)
5. username generati automaticamente
6. validazione email per ruolo (@polimi.it vs @service.polimi.it)
7. Docker/CI.
---

## Note sul progetto

Per provare in fretta l'app puoi usare le credenziali di test scritte all'inizio di questo file. Per vedere liste, ticket e commenti serve comunque avere il backend avviato.

Per quanto riguarda la sicurezza: questo e' un progetto didattico, non un sistema in produzione. Le limitazioni principali sono documentate nel README del backend.
