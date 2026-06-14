import { db } from "../config/db";
import { ApiError } from "../errors/ApiError";

//DEFINISCO DEGLI UTILS
const statoVisibile = (t: any) => t.stato === "CHIUSO" ? { ...t, stato: "RISOLTO" } : t; //funzione per convertire lo stato CHIUSO in RISOLTO

//DEFINISCO LE FUNZIONI --> la maggior parte delle funzioni sono solo per estrapolare dati dal db

export async function getTickets(f: any) {
  const where: any = {};
  if (f.categoria) where.categoria = f.categoria; //se la categoria è specificata, filtro per categoria
  if (f.stato === "RISOLTO") where.stato = { in: ["RISOLTO", "CHIUSO"] }; //se lo stato è RISOLTO, filtro per stato RISOLTO o CHIUSO
  else if (f.stato) where.stato = f.stato;
  if (f.priorita) where.priorita = f.priorita; //se la priorità è specificata, filtro per priorità
  if (f.tecnico) where.tecnico = { contains: f.tecnico, mode: "insensitive" }; //se il tecnico è specificato, filtro per tecnico
  if (f.autore) where.autore = { contains: f.autore, mode: "insensitive" }; //se l'autore è specificato, filtro per autore
  const tickets = await db.ticket.findMany({ where, orderBy: { id: "desc" } });
  return tickets.map(statoVisibile).map(t => (!t.tecnico || t.stato === "IN_ATTESA") ? { ...t, priorita: null } : t); //per ottenere i ticket filtrati
}

export async function getTicketDetails(id: number) { //per ottenere i dettagli di un ticket
  const t = await db.ticket.findUnique({ where: { id }, include: { ticketComments: true, ticketStateLogs: { orderBy: { id: "asc" } } } });
  if (!t) throw new ApiError(404, "Ticket non trovato"); //se il ticket non esiste, lancio un errore
  const priorita = (!t.tecnico || t.stato === "IN_ATTESA") ? null : t.priorita;
  const commenti = t.ticketComments.filter(c => !/^(Stato|Gravità)\s/.test(c.testo)); //per ottenere i commenti filtrati
  const storicoStati = t.ticketStateLogs.map(s => s.statoNuovo === "CHIUSO" ? { ...s, statoNuovo: "RISOLTO" } : s);
  return statoVisibile({ ...t, priorita, commenti, storicoStati });
}

export async function createTicket(data: any) { //per creare un nuovo ticket
  const now = new Date().toISOString(); //per ottenere la data e l'ora corrente
  const t = await db.ticket.create({ data: { ...data, stato: "IN_ATTESA", priorita: null, dataCreazione: now, dataAggiornamento: now } });
  await db.ticketStateLog.create({ data: { ticketId: t.id, statoNuovo: "IN_ATTESA", cambiatoIl: now, cambiatoDa: data.autore } });
  return (await assegnaTicketAuto(t.id)) || t; //per assegnare il ticket automaticamente
}

export async function aggiornaStato(id: number, stato: string, chi: string) { //per aggiornare lo stato di un ticket
  if (!["IN_ATTESA", "PRESO_IN_CARICO", "IN_LAVORAZIONE", "RISOLTO"].includes(stato)) throw new ApiError(400, "Stato non valido"); //se lo stato non è valido, lancio un errore
  const t = await db.ticket.update({ where: { id }, data: { stato, dataAggiornamento: new Date().toISOString() } });
  await db.ticketStateLog.create({ data: { ticketId: id, statoNuovo: stato, cambiatoIl: new Date().toISOString(), cambiatoDa: chi } });
  return t; //per ottenere il ticket aggiornato
}

export async function aggiornaPriorita(id: number, priorita: string, tecnico: string) { //per aggiornare la gravità di un ticket
  const t = await db.ticket.findUnique({ where: { id } });
  if (!t || !t.tecnico || t.tecnico !== tecnico) throw new ApiError(403, "Solo il tecnico assegnato può definire la gravità");
  if (t.stato === "IN_ATTESA") throw new ApiError(400, "Prendi in carico il ticket prima di assegnare la gravità"); //se il ticket è in attesa, lancio un errore
  if (t.stato === "RISOLTO" || t.stato === "CHIUSO") throw new ApiError(400, "La gravita non si puo modificare dopo la risoluzione"); //se il ticket è risolto o chiuso, lancio un errore
  return db.ticket.update({ where: { id }, data: { priorita, dataAggiornamento: new Date().toISOString() } });
}

export async function prendiInCarico(id: number, username: string) { //per assegnare un ticket a un tecnico
  const t = await db.ticket.findUnique({ where: { id } }); //per ottenere il ticket
  if (!t || t.stato === "RISOLTO" || t.stato === "CHIUSO") throw new ApiError(400, "Non assegnabile"); //se il ticket non esiste o è risolto o chiuso, lancio un errore
  const st = t.stato === "IN_ATTESA" ? "PRESO_IN_CARICO" : (t.stato || "IN_ATTESA"); //se il ticket è in attesa, assegnalo a tecnico, altrimenti mantienilo come è
  const res = await db.ticket.update({ where: { id }, data: { tecnico: username, stato: st, dataAggiornamento: new Date().toISOString() } });
  if (st !== t.stato) await db.ticketStateLog.create({ data: { ticketId: id, statoNuovo: st, cambiatoIl: new Date().toISOString(), cambiatoDa: username } });
  return res;
}

// --- Auto-assegnazione persistita su DB ---

async function tecnicoConMenoTicket(): Promise<string | null> { //Promise<string | null> per indicare che la funzione può restituire un stringa o null
  const tecs = await db.user.findMany({ where: { ruolo: "TECNICO", autoAssegnazione: true } }); //per ottenere i tecnici
  if (!tecs.length) return null; //se non ci sono tecnici, restituisci null
  const counts = await Promise.all( //per ottenere il numero di ticket per ogni tecnico
    tecs.map(async u => ({
      u: u.username, //per ottenere il username del tecnico
      c: await db.ticket.count({ where: { tecnico: u.username, stato: { in: ["PRESO_IN_CARICO", "IN_LAVORAZIONE"] } } }) //per ottenere il numero di ticket per ogni tecnico
    }))
  );
  return counts.sort((a, b) => a.c - b.c)[0].u;
}

async function assegnaTicketAuto(ticketId: number) {
  const scelto = await tecnicoConMenoTicket(); //per ottenere il tecnico con meno ticket
  if (!scelto) return null; //se non ci sono tecnici, restituisci null
  const t = await db.ticket.findFirst({ where: { id: ticketId, stato: "IN_ATTESA", tecnico: null } }); //per ottenere il ticket
  if (!t) return null;
  const now = new Date().toISOString(); //per ottenere la data e l'ora corrente in formato ISO
  await db.ticket.update({ where: { id: ticketId }, data: { tecnico: scelto, stato: "PRESO_IN_CARICO", dataAggiornamento: now } });
  await db.ticketStateLog.create({ data: { ticketId, statoNuovo: "PRESO_IN_CARICO", cambiatoIl: now, cambiatoDa: scelto } });
  return db.ticket.findUnique({ where: { id: ticketId } }); //per ottenere il ticket aggiornato
}

export async function assegnaInAttesa() {
  const pending = await db.ticket.findMany({ where: { stato: "IN_ATTESA", tecnico: null }, orderBy: { id: "asc" } }); //per ottenere i ticket in attesa
  //ordiniamo i ticket in ordine crescente per id
  for (const t of pending) await assegnaTicketAuto(t.id);
}

export async function aggiungiCommento(ticketId: number, testo: string, autore: string) { //per aggiungere un commento a un ticket
  await db.ticket.update({ where: { id: ticketId }, data: { dataAggiornamento: new Date().toISOString() } }); //per aggiornare la data di aggiornamento del ticket
  return db.ticketComment.create({ data: { ticketId, testo, autoreUsername: autore, creatoIl: new Date().toISOString() } }); //per creare un nuovo commento
}

export async function inviaFeedback(id: number, valutazione: number) { //per inviare un feedback a un ticket
  return db.ticket.update({ where: { id }, data: { valutazione, dataValutazione: new Date().toISOString(), dataAggiornamento: new Date().toISOString() } }); //per aggiornare la valutazione del ticket
}


export async function getStatsFeedback(tecnico?: string) { //per ottenere le statistiche dei feedback
  const res = await db.ticket.aggregate({ where: { stato: { in: ["RISOLTO", "CHIUSO"] }, valutazione: { not: null }, tecnico }, _avg: { valutazione: true }, _count: { valutazione: true } }); //per ottenere la media e il numero di feedback
  return { media: res._avg.valutazione, count: res._count.valutazione }; //per ottenere la media e il numero di feedback
}
