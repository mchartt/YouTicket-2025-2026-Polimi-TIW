const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

async function req(path: string, method = "GET", body?: any) {
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error || "Errore API";
      const e: any = new Error(msg);

      if (err.details) {
        e.fields = {};
        for (const d of err.details) {
          const key = d.path?.[0] === "password" ? "pass" : d.path?.[0];
          if (key) e.fields[key] = d.message;
        }
      }
      throw e;
    }

    return res.status !== 204 ? res.json() : null;
  } catch (err: any) {
    if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
      throw new Error("Errore di connessione: verifica la tua connessione internet o il server API.");
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
  changeStatus:             (id: number, b: any) => req(`/tickets/${id}/stato`, "PATCH", b),
  changePriority:           (id: number, p: string, tecnico: string) => req(`/tickets/${id}/priorita`, "PATCH", { priorita: p, tecnicoUsername: tecnico }),
  takeCharge:               (id: number, tecnico: string) => req(`/tickets/${id}/assegna`, "PATCH", { tecnicoUsername: tecnico }),
  addComment:               (id: number, b: any) => req(`/tickets/${id}/commenti`, "POST", b),
  sendFeedback:             (id: number, valutazione: number) => req(`/tickets/${id}/feedback`, "POST", { valutazione }),
  toggleAutoAssegnazione:   (username: string, attiva: boolean) => req("/auth/auto-assegnazione", "PATCH", { tecnicoUsername: username, attiva }),
};
