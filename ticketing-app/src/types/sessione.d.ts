import "express-session";

//estendo la sessione con l'utente loggato e la notifica flash (sostituiscono localStorage + notify() del frontend React)
declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      ruolo: string;
      nome?: string | null;
      autoAssegnazione?: boolean;
    };
    flash?: { tipo?: string; testo: string };
  }
}
