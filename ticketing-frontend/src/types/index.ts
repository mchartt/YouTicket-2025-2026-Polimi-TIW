export interface User {
  id: number;
  username: string;
  ruolo: "UTENTE" | "TECNICO";
  nome?: string;
  autoAssegnazione?: boolean;
}

export interface Ticket {
  id: number;
  titolo: string;
  descrizione: string;
  categoria: string;
  stato: string;
  autore?: string;
  tecnico?: string;
  priorita?: string | null;
  valutazione?: number;
  archiviato?: boolean;
  dataCreazione: string;
  dataAggiornamento: string;
}

export interface TicketDetail extends Ticket {
  commenti: {
    id: number;
    testo: string;
    autoreUsername: string;
    creatoIl: string;
  }[];

  storicoStati: {
    id: number;
    statoNuovo: string;
    cambiatoIl: string;
    cambiatoDa?: string;
  }[];

  allegati: {
    id: number;
    nomeFile: string;
    tipo: string;
    creatoIl: string;
  }[];
}
