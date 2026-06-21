# Frontend - note per orientarsi

Frontend React + TypeScript + Vite del progetto YouTicket.

---

## Flusso principale

Il frontend non usa pagine separate con routing: la schermata cambia in base allo stato dell'utente.

- Se non c'e' un utente salvato, viene mostrata la schermata di login/registrazione.
- Dopo l'accesso, viene mostrata la dashboard.
- La dashboard cambia comportamento in base al ruolo: utente o tecnico.
- Il dettaglio ticket e la creazione di un nuovo ticket si aprono in una modale.

---

## File principali

Il codice è organizzato in cartelle per tipo (componenti, servizi, tipi, ecc.):

| File | A cosa serve |
|------|--------------|
| `src/main.tsx` | Punto di ingresso dell'app React. Monta `App` dentro `#root` e importa Bootstrap. |
| `src/App.tsx` | Gestisce utente loggato, logout, notifiche e layout principale. |
| `src/components/Auth.tsx` | Schermata di accesso e registrazione, con controlli base sui campi. |
| `src/components/Dashboard.tsx` | Lista ticket, filtri, statistiche tecnico e apertura della modale ticket. |
| `src/components/TicketModal.tsx` | Creazione ticket, dettaglio ticket, commenti, cambio stato, priorita e feedback. |
| `src/services/api.ts` | Funzioni `fetch` verso il backend. Usa `VITE_API_BASE_URL` se presente. |
| `src/context/AppContext.ts` | Context React (`AppCtx`) per condividere dati tra i componenti senza passarli come prop. |
| `src/constants/ticketStatus.ts` | Mappa stato del ticket → classi Bootstrap per i colori dei badge. |
| `src/types/index.routes.ts` | Tipi TypeScript condivisi tra i componenti. |
| `public/logo-ticket.svg` | Logo dell'app, usato come favicon. |
| `vercel.json` | Configurazione Vercel per build Vite e fallback SPA su `index.html`. |

---

## Stili

L'interfaccia usa Bootstrap 5, importato in `src/main.tsx`. Non c'è un file CSS custom: le poche cose che Bootstrap non copre con le sue classi (qualche colore, una larghezza, il gradiente del login) le ho messe come stili inline direttamente nei componenti.

---

## Funzioni coperte

- Creazione ticket con titolo, descrizione e categoria.
- Priorita gestita dal backend alla creazione e modificabile dal tecnico.
- Commenti utente/tecnico nel dettaglio ticket, mostrati a fumetto: i miei a sinistra in celeste, quelli dell'altra persona a destra. La conversazione sta in un riquadro che scorre da solo e si porta in fondo quando arriva un messaggio. La chat e' in tempo reale: la modale apre una WebSocket sul ticket aperto e i nuovi commenti compaiono appena il server li trasmette, senza polling.
- Allegati ai ticket: caricamento, download ed eliminazione.
- Cambio stato tecnico fino a `RISOLTO`.
- Storico cambi stato nel dettaglio.
- Filtri tecnico per categoria, stato, priorita e tecnico assegnato.
- Feedback utente sui ticket risolti o chiusi.

---

## Comandi utili

```bash
npm install
npm start
npm run build
npm run preview
```

---

## Deploy Vercel

Il frontend legge l'URL del backend dalla variabile di build Vite `VITE_API_BASE_URL`.

Per collegarlo al backend Railway imposta su Vercel:

```env
VITE_API_BASE_URL=https://youticket-yr-2025-2026-production.up.railway.app/api
```

Dopo averla aggiunta, fai un redeploy del frontend: Vite incorpora questa variabile durante la build.
