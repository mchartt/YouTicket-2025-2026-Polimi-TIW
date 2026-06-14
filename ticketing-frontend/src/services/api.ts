const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";


//funzione generica per fare richieste HTTP all'API, gestendo errori e parsing della risposta
async function req(path: string, method = "GET", body?: any) { 
  try {
    const res = await fetch(BASE + path, {
      method, //metodo HTTP (GET, POST, PATCH, DELETE, ecc.)
      headers: body ? { "Content-Type": "application/json" } : undefined, //il Content-Type serve solo quando c'è un body (POST/PATCH); su GET/DELETE lo ometto
      body: body ? JSON.stringify(body) : undefined //se body è presente lo trasformo in JSON, altrimenti lo lascio undefined
    });

    if (!res.ok) { //se la risposta non è ok (status code 4xx o 5xx) allora lancio un errore
      const err = await res.json().catch(() => ({})); //se la risposta non è JSON allora ritorno un oggetto vuoto
      const msg = err.error || "Errore API"; //se l'API ritorna un messaggio di errore lo uso, altrimenti uso un messaggio generico
      const e: any = new Error(msg); //creo un nuovo errore con il messaggio

      if (err.details) { //se l'API ritorna dettagli dell'errore (es. validazione dei campi) allora li aggiungo all'errore
        e.fields = {};
        for (const d of err.details) {
          const key = d.path?.[0] === "password" ? "pass" : d.path?.[0]; //se il campo è password lo rinomino in pass per non confonderlo con la password dell'utente
          if (key) e.fields[key] = d.message; //aggiungo il messaggio di errore al campo corrispondente
        }
      }
      throw e;
    }

    return res.status !== 204 ? res.json() : null; //se la risposta non è 204 (No Content) allora ritorno il JSON, altrimenti ritorno null
  } catch (err: any) { //prendo quaalsiasi errore che può essere generato da fetch o dal parsing della risposta
    if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) { //se errore di connessione (es. server non raggiungibile, timeout, ecc.)
      throw new Error("Errore di connessione: verifica la tua connessione internet o il server API."); //lancio un nuovo errore con un messaggio più chiaro
    }
    throw err;
  }
}

export const api = {
  login:                    (b: any) => req("/auth/login", "POST", b),
  register:                 (b: any) => req("/auth/register", "POST", b),
  cats:                     () => req("/categorie?attive=true"),
  tickets:                  (q = "") => req(`/tickets/search${q ? "?" + q : ""}`),
  ticketDetails:            (id: number) => req(`/tickets/${id}`),
  createTicket:             (b: any) => req("/tickets", "POST", b),
  editTicket:               (id: number, b: any) => req(`/tickets/${id}`, "PATCH", b),
  archiveTicket:            (id: number) => req(`/tickets/${id}/archivia`, "PATCH"),
  changeStatus:             (id: number, b: any) => req(`/tickets/${id}/stato`, "PATCH", b),
  changePriority:           (id: number, p: string, tecnico: string) => req(`/tickets/${id}/priorita`, "PATCH", { priorita: p, tecnicoUsername: tecnico }),
  takeCharge:               (id: number, tecnico: string) => req(`/tickets/${id}/assegna`, "PATCH", { tecnicoUsername: tecnico }),
  addComment:               (id: number, b: any) => req(`/tickets/${id}/commenti`, "POST", b),
  addAttachment:            (id: number, b: any) => req(`/tickets/${id}/allegati`, "POST", b),
  deleteAttachment:         (id: number, allegatoId: number) => req(`/tickets/${id}/allegati/${allegatoId}`, "DELETE"),
  attachmentUrl:            (id: number, allegatoId: number) => `${BASE}/tickets/${id}/allegati/${allegatoId}/download`,
  sendFeedback:             (id: number, valutazione: number) => req(`/tickets/${id}/feedback`, "POST", { valutazione }),
  stats:                    (tecnico = "") => req(`/tickets/stats/feedback${tecnico ? "?tecnico=" + tecnico : ""}`),
  toggleAutoAssegnazione:   (username: string, attiva: boolean) => req("/auth/auto-assegnazione", "PATCH", { tecnicoUsername: username, attiva }),
};
