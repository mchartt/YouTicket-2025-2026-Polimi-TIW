const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";


//funzione generica per fare richieste HTTP all'API, gestendo errori e parsing della risposta
async function req(path: string, method = "GET", body?: any) {
  try {
    const token = sessionStorage.getItem("token");
    const headers: any = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

    const res = await fetch(BASE + path, {
      method, //metodo HTTP (GET, POST, PATCH, DELETE, ecc.)
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: (body && !(body instanceof FormData)) ? JSON.stringify(body) : body
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
  } catch (err: any) { //prendo qualsiasi errore che può essere generato da fetch o dal parsing della risposta
    if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) { //se errore di connessione (es. server non raggiungibile, timeout, ecc.)
      throw new Error("Errore di connessione: verifica la tua connessione internet o il server API."); //lancio un nuovo errore con un messaggio più chiaro
    }
    throw err;
  }
}

export const api = {
  login:                    (b: any) => req("/auth/login", "POST", b),
  register:                 (b: any) => req("/auth/register", "POST", b),
  categorie:                     () => req("/categorie"),
  creaCategoria:        (nome: string) => req("/categorie", "POST", { nome }),
  modificaCategoria:    (id: number, nome: string) => req(`/categorie/${id}`, "PATCH", { nome }),
  eliminaCategoria:     (id: number) => req(`/categorie/${id}`, "DELETE"),
  tickets:                  (q = "") => req(`/tickets/search${q ? "?" + q : ""}`),
  dettagliTicket:            (id: number) => req(`/tickets/${id}`),
  creaTicket:             (b: any) => req("/tickets", "POST", b),
  modificaTicket:               (id: number, b: any) => req(`/tickets/${id}`, "PATCH", b),
  archiviaTicket:            (id: number) => req(`/tickets/${id}/archivia`, "PATCH"),
  cambiaStato:             (id: number, b: any) => req(`/tickets/${id}/stato`, "PATCH", b),
  changePriority:           (id: number, p: string) => req(`/tickets/${id}/priorita`, "PATCH", { priorita: p }), //il tecnico è quello del token lato server
  takeCharge:               (id: number) => req(`/tickets/${id}/assegna`, "PATCH"), //prende in carico chi è loggato (token)
  aggiungiCommento:               (id: number, b: any) => req(`/tickets/${id}/commenti`, "POST", b),
  aggiungiAllegato:            (id: number, b: any) => req(`/tickets/${id}/allegati`, "POST", b),
  aggiungiURL:            (id: number, allegatoId: number) => `${BASE}/tickets/${id}/allegati/${allegatoId}/download`,
  serverURL:                        () => BASE.replace(/\/api\/?$/, ""), //da http(s)://host/api a http(s)://host per la chat Socket.IO

  inviaFeedback:             (id: number, valutazione: number) => req(`/tickets/${id}/feedback`, "POST", { valutazione }),
  stats:                    (tecnico = "") => req(`/tickets/stats/feedback${tecnico ? "?tecnico=" + tecnico : ""}`),
  toggleAutoAssegnazione:   (attiva: boolean) => req("/auth/auto-assegnazione", "PATCH", { attiva }), //l'utente è quello del token lato server
};
