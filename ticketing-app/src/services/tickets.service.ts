import { db } from "../config/db";
import { ApiError } from "../errors/ApiError";

//DEFINISCO DEGLI UTILS
const adesso = () => new Date().toISOString(); //timestamp ISO corrente (usato in tutte le scritture)
const mostraStato = (s: string) => s === "CHIUSO" ? "RISOLTO" : s; //all'esterno lo stato CHIUSO si mostra come RISOLTO
const statoVisibile = (t: any) => ({ ...t, stato: mostraStato(t.stato) }); //applica la conversione stato al ticket
const prioritaVisibile = (t: any) => (!t.tecnico || t.stato === "IN_ATTESA") ? null : t.priorita; //la priorità si vede solo dopo la presa in carico

const validaTesti = (titolo?: string, descrizione?: string) => { //controllo lunghezze massime di titolo e descrizione
  if (!titolo || !titolo.trim() || titolo.length > 60) throw new ApiError(400, "Il titolo può avere al massimo 60 caratteri");
  if (!descrizione || !descrizione.trim() || descrizione.length > 200) throw new ApiError(400, "La descrizione può avere al massimo 200 caratteri");
};

//DEFINISCO LE FUNZIONI --> la maggior parte delle funzioni sono solo per estrapolare dati dal db

export async function getTickets(f: any) {
  const where: any = {};
  where.archiviato = f.archiviato === "true"; //mostro i ticket archiviati solo nella sezione archivio, altrimenti quelli attivi
  if (f.categoria) where.categoria = f.categoria; //se la categoria è specificata, filtro per categoria
  if (f.stato === "RISOLTO") where.stato = { in: ["RISOLTO", "CHIUSO"] }; //se lo stato è RISOLTO, filtro per stato RISOLTO o CHIUSO
  else if (f.stato) where.stato = f.stato;
  if (f.priorita) where.priorita = f.priorita; //se la priorità è specificata, filtro per priorità
  if (f.tecnico) where.tecnico = { contains: f.tecnico, mode: "insensitive" }; //se il tecnico è specificato, filtro per tecnico
  if (f.autore) where.autore = { contains: f.autore, mode: "insensitive" }; //se l'autore è specificato, filtro per autore
  if (f.q) where.OR = [{ titolo: { contains: f.q, mode: "insensitive" } }, { descrizione: { contains: f.q, mode: "insensitive" } }]; //ricerca testuale su titolo e descrizione
  const tickets = await db.ticket.findMany({ where, orderBy: { id: "desc" } });
  return tickets.map(statoVisibile).map(t => ({ ...t, priorita: prioritaVisibile(t) })); //per ottenere i ticket filtrati
}

export async function getTicketDetails(id: number) { //per ottenere i dettagli di un ticket
  const t = await db.ticket.findUnique({ where: { id }, include: { ticketComments: true, ticketStateLogs: { orderBy: { id: "asc" } }, allegati: { select: { id: true, nomeFile: true, tipo: true, creatoIl: true }, orderBy: { id: "asc" } } } });
  if (!t) throw new ApiError(404, "Ticket non trovato"); //se il ticket non esiste, lancio un errore
  const priorita = prioritaVisibile(t);
  const commenti = t.ticketComments; //i cambi di stato sono salvati in ticketStateLog, qui mostro tutti i commenti dell'utente
  const storicoStati = t.ticketStateLogs.map(s => ({ ...s, statoNuovo: mostraStato(s.statoNuovo) }));
  return statoVisibile({ ...t, priorita, commenti, storicoStati });
}

export async function createTicket(data: any) { //per creare un nuovo ticket
  validaTesti(data.titolo, data.descrizione);
  const categoria = await db.categoria.findFirst({ where: { nome: { equals: data.categoria, mode: "insensitive" } } });
  if (!categoria) throw new ApiError(400, "Categoria non valida"); //la categoria deve esistere davvero
  const now = adesso(); //per ottenere la data e l'ora corrente
  const t = await db.ticket.create({ data: { titolo: data.titolo, descrizione: data.descrizione, categoria: data.categoria, autore: data.autore, stato: "IN_ATTESA", priorita: null, dataCreazione: now, dataAggiornamento: now } }); //whitelist dei campi: il client non può impostare tecnico/valutazione/archiviato
  await db.ticketStateLog.create({ data: { ticketId: t.id, statoNuovo: "IN_ATTESA", cambiatoIl: now, cambiatoDa: data.autore } });
  return (await assegnaTicketAuto(t.id)) || t; //per assegnare il ticket automaticamente
}

export async function modificaTicket(id: number, data: any, autore: string) { //l'autore può correggere il ticket entro 15 minuti dalla creazione
  const t = await db.ticket.findUnique({ where: { id } });
  if (!t) throw new ApiError(404, "Ticket non trovato");
  if (t.autore !== autore) throw new ApiError(403, "Solo l'autore può modificare il ticket");
  const minutiTrascorsi = (Date.now() - new Date(t.dataCreazione!).getTime()) / 60000; //differenza in minuti tra adesso e la creazione
  if (minutiTrascorsi > 15) throw new ApiError(403, "Modifica consentita solo entro 15 minuti dalla creazione");
  validaTesti(data.titolo, data.descrizione);
  const categoria = await db.categoria.findFirst({ where: { nome: { equals: data.categoria, mode: "insensitive" } } });
  if (!categoria) throw new ApiError(400, "Categoria non valida"); //come in createTicket: la categoria deve esistere
  return db.ticket.update({ where: { id }, data: { titolo: data.titolo, descrizione: data.descrizione, categoria: data.categoria, dataAggiornamento: adesso() } });
}

export async function archiviaTicket(id: number, username: string) { //sposto nell'archivio un ticket già risolto
  const t = await db.ticket.findUnique({ where: { id } });
  if (!t) throw new ApiError(404, "Ticket non trovato");
  if (t.autore !== username && t.tecnico !== username) throw new ApiError(403, "Non autorizzato ad archiviare questo ticket"); //solo autore o tecnico assegnato
  if (t.stato !== "RISOLTO" && t.stato !== "CHIUSO") throw new ApiError(400, "Solo i ticket risolti possono essere archiviati");
  return db.ticket.update({ where: { id }, data: { archiviato: true, dataAggiornamento: adesso() } });
}

export async function aggiornaStato(id: number, stato: string, chi: string) { //per aggiornare lo stato di un ticket
  if (!["IN_ATTESA", "PRESO_IN_CARICO", "IN_LAVORAZIONE", "RISOLTO"].includes(stato)) throw new ApiError(400, "Stato non valido"); //se lo stato non è valido, lancio un errore
  const corrente = await db.ticket.findUnique({ where: { id } });
  if (!corrente) throw new ApiError(404, "Ticket non trovato");
  if (!corrente.tecnico || corrente.tecnico !== chi) throw new ApiError(403, "Solo il tecnico assegnato può cambiare lo stato"); //autorizzazione: deve essere il tecnico del ticket
  if (corrente.stato === "RISOLTO" || corrente.stato === "CHIUSO") throw new ApiError(400, "Il ticket è già risolto"); //un ticket risolto non si riapre
  if (stato === "IN_LAVORAZIONE" && !corrente.priorita) throw new ApiError(400, "Assegna prima una priorità per passare in lavorazione"); //il ticket va in lavorazione solo dopo aver assegnato la priorità
  if (stato === "RISOLTO" && corrente.stato !== "IN_LAVORAZIONE") throw new ApiError(400, "Il ticket deve prima passare in lavorazione"); //non si può risolvere saltando la fase di lavorazione
  const t = await db.ticket.update({ where: { id }, data: { stato, dataAggiornamento: adesso() } });
  await db.ticketStateLog.create({ data: { ticketId: id, statoNuovo: stato, cambiatoIl: adesso(), cambiatoDa: chi } });
  return t; //per ottenere il ticket aggiornato
}

export async function aggiornaPriorita(id: number, priorita: string, tecnico: string) { //per aggiornare la gravità di un ticket
  const t = await db.ticket.findUnique({ where: { id } });
  if (!t) throw new ApiError(404, "Ticket non trovato");
  if (!t.tecnico || t.tecnico !== tecnico) throw new ApiError(403, "Solo il tecnico assegnato può definire la gravità");
  if (t.stato === "IN_ATTESA") throw new ApiError(400, "Prendi in carico il ticket prima di assegnare la gravità"); //se il ticket è in attesa, lancio un errore
  if (t.stato === "RISOLTO" || t.stato === "CHIUSO") throw new ApiError(400, "La gravita non si puo modificare dopo la risoluzione"); //se il ticket è risolto o chiuso, lancio un errore
  return db.ticket.update({ where: { id }, data: { priorita, dataAggiornamento: adesso() } });
}

export async function prendiInCarico(id: number, username: string) { //per assegnare un ticket a un tecnico
  const t = await db.ticket.findUnique({ where: { id } }); //per ottenere il ticket
  if (!t) throw new ApiError(404, "Ticket non trovato");
  if (t.stato === "RISOLTO" || t.stato === "CHIUSO") throw new ApiError(400, "Non assegnabile"); //se è risolto o chiuso, lancio un errore
  if (t.tecnico && t.tecnico !== username) throw new ApiError(409, "Ticket già preso in carico da un altro tecnico"); //non si può rubare un ticket altrui
  const st = t.stato === "IN_ATTESA" ? "PRESO_IN_CARICO" : (t.stato || "IN_ATTESA"); //se il ticket è in attesa, assegnalo a tecnico, altrimenti mantienilo come è
  const res = await db.ticket.update({ where: { id }, data: { tecnico: username, stato: st, dataAggiornamento: adesso() } });
  if (st !== t.stato) await db.ticketStateLog.create({ data: { ticketId: id, statoNuovo: st, cambiatoIl: adesso(), cambiatoDa: username } });
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
  const now = adesso(); //per ottenere la data e l'ora corrente in formato ISO
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
  if (!testo || !testo.trim()) throw new ApiError(400, "Il commento non può essere vuoto"); //niente commenti vuoti
  const t = await db.ticket.findUnique({ where: { id: ticketId } });
  if (!t) throw new ApiError(404, "Ticket non trovato");
  if (autore !== t.autore && autore !== t.tecnico) throw new ApiError(403, "Non puoi commentare questo ticket"); //solo autore o tecnico assegnato
  await db.ticket.update({ where: { id: ticketId }, data: { dataAggiornamento: adesso() } }); //per aggiornare la data di aggiornamento del ticket
  return db.ticketComment.create({ data: { ticketId, testo, autoreUsername: autore, creatoIl: adesso() } }); //per creare un nuovo commento
}

export async function aggiungiAllegato(ticketId: number, data: any) { //per allegare un file a un ticket (salvato come data URL)
  const t = await db.ticket.findUnique({ where: { id: ticketId } });
  if (!t) throw new ApiError(404, "Ticket non trovato");
  if (!data.nomeFile || !data.tipo || !data.dati) throw new ApiError(400, "Allegato non valido"); //servono nome, tipo e contenuto del file
  if (data.dati.length > 7000000) throw new ApiError(400, "File troppo grande (max 5MB)"); //~5MB una volta convertito in base64
  //conto e creo nella stessa transazione serializzabile: così due upload simultanei non superano i 3 allegati
  const a = await db.$transaction(async (tx) => {
    if (await tx.allegato.count({ where: { ticketId } }) >= 3) throw new ApiError(400, "Massimo 3 allegati per ticket"); //limite di 3 allegati
    return tx.allegato.create({ data: { ticketId, nomeFile: data.nomeFile, tipo: data.tipo, dati: data.dati, creatoIl: adesso() } });
  }, { isolationLevel: "Serializable" });
  return { id: a.id, nomeFile: a.nomeFile, tipo: a.tipo, creatoIl: a.creatoIl }; //rispondo senza i dati pesanti del file
}

export async function getAllegato(id: number) { //recupero un allegato per il download
  const a = await db.allegato.findUnique({ where: { id } });
  if (!a) throw new ApiError(404, "Allegato non trovato");
  return a;
}

export async function inviaFeedback(id: number, valutazione: number, username: string) { //per inviare un feedback a un ticket
  if (!Number.isInteger(valutazione) || valutazione < 1 || valutazione > 5) throw new ApiError(400, "La valutazione deve essere un intero da 1 a 5");
  const t = await db.ticket.findUnique({ where: { id } });
  if (!t) throw new ApiError(404, "Ticket non trovato");
  if (t.autore !== username) throw new ApiError(403, "Solo l'autore può valutare il ticket"); //solo chi ha aperto il ticket
  if (t.stato !== "RISOLTO" && t.stato !== "CHIUSO") throw new ApiError(400, "Puoi valutare solo un ticket risolto"); //feedback solo a ticket risolto
  if (t.valutazione) throw new ApiError(400, "Ticket già valutato"); //niente sovrascrittura del feedback
  return db.ticket.update({ where: { id }, data: { valutazione, dataValutazione: adesso(), dataAggiornamento: adesso() } }); //per aggiornare la valutazione del ticket
}

export async function eliminaTicket(id: number) { //rollback creazione: rimuove un ticket (allegati/commenti/log eliminati in cascade)
  await db.ticket.delete({ where: { id } });
}


export async function getStatsFeedback(tecnico?: string) { //per ottenere le statistiche dei feedback
  const res = await db.ticket.aggregate({ where: { stato: { in: ["RISOLTO", "CHIUSO"] }, valutazione: { not: null }, tecnico }, _avg: { valutazione: true }, _count: { valutazione: true } }); //per ottenere la media e il numero di feedback
  return { media: res._avg.valutazione, count: res._count.valutazione }; //per ottenere la media e il numero di feedback
}
