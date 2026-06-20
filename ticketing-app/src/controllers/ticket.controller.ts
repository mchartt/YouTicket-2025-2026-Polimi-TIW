import { messaggioErrore } from "../errors/messaggioErrore";
import { ApiError } from "../errors/ApiError";
import * as ticketsService from "../services/tickets.service";
import * as categorieService from "../services/categorie.service";
import { inviaCommento } from "../websocket-server"; //per trasmettere i nuovi commenti via socket.io

//handler delle pagine del ticket: nuova richiesta, dettaglio e azioni (stato, priorità, commenti, ...).
//logica di business in tickets.service; qui solo orchestrazione HTTP (try/catch, flash, render).

//----------------- NUOVA RICHIESTA -----------------

//pagina con il form per creare un ticket (solo UTENTE)
export const mostraNuovo = async (req: any, res: any) => {
  if (req.session.user.ruolo !== "UTENTE") return res.redirect("/");
  const categorie = await categorieService.getCategorie(true);
  res.render("pagine/nuovo-ticket", { titolo: "Nuova richiesta - YouTicket", categorie, errore: null, valori: {} });
};

//creazione ticket + allegati (upload via multipart; req.erroreUpload arriva dal middleware caricaAllegati)
export const crea = async (req: any, res: any) => {
  const user = req.session.user;
  let creato: any = null; //tengo il ticket creato per poterlo annullare se un allegato fallisce dopo
  try {
    if (req.erroreUpload) throw new ApiError(400, req.erroreUpload); //errore dell'upload (file troppo grande): mostro la pagina, non un 500
    if (user.ruolo !== "UTENTE") throw new ApiError(403, "Solo gli utenti possono creare richieste");
    //converto i file caricati in data URL, così riuso aggiungiAllegato senza toccarlo
    const allegati = (req.files || []).map((f: any) => ({ nomeFile: f.originalname, tipo: f.mimetype, dati: `data:${f.mimetype};base64,${f.buffer.toString("base64")}` }));
    //stessi limiti/messaggi del service, controllati prima di creare per non lasciare ticket a metà
    if (allegati.length > 3) throw new ApiError(400, "Massimo 3 allegati per ticket");
    for (const a of allegati) if (a.dati.length > 7000000) throw new ApiError(400, "File troppo grande (max 5MB)");

    creato = await ticketsService.createTicket({ titolo: req.body.titolo, descrizione: req.body.descrizione, categoria: req.body.categoria, autore: user.username });
    for (const a of allegati) await ticketsService.aggiungiAllegato(creato.id, a); //ora che il ticket esiste carico gli allegati
    req.session.flash = { tipo: "success", testo: "Richiesta inviata!" };
    res.redirect("/");
  } catch (err: any) {
    if (creato) await ticketsService.eliminaTicket(creato.id).catch(() => {}); //rollback: evito il ticket creato a metà
    const categorie = await categorieService.getCategorie(true);
    res.render("pagine/nuovo-ticket", { titolo: "Nuova richiesta - YouTicket", categorie, errore: messaggioErrore(err), valori: { titolo: req.body.titolo, descrizione: req.body.descrizione, categoria: req.body.categoria } });
  }
};

//----------------- DETTAGLIO + AZIONI -----------------

//pagina di dettaglio del ticket (con eventuale form di modifica via ?modifica=1)
export const mostra = async (req: any, res: any) => {
  try {
    const ticket = await ticketsService.getTicketDetails(+req.params.id);
    //autorizzazione: un UTENTE può vedere solo i propri ticket (il tecnico vede tutto)
    if (req.session.user.ruolo === "UTENTE" && ticket.autore !== req.session.user.username) {
      req.session.flash = { tipo: "danger", testo: "Non autorizzato" };
      return res.redirect("/");
    }
    const categorie = await categorieService.getCategorie(true);
    const editMode = req.query.modifica === "1"; //modalità modifica
    res.render("pagine/ticket", { titolo: `#${ticket.id} - ${ticket.titolo}`, ticket, categorie, editMode });
  } catch {
    req.session.flash = { tipo: "danger", testo: "Errore nel caricamento" };
    res.redirect("/");
  }
};

//helper: torna alla pagina del dettaglio dopo un'azione
const tornaAlDettaglio = (req: any, res: any) => res.redirect("/ticket/" + req.params.id);

//helper: schema comune a più azioni sul ticket -> esegue, imposta la flash e torna al dettaglio
const applicaAzione = (testo: string, fn: (req: any) => Promise<any>) =>
  async (req: any, res: any) => {
    try {
      await fn(req);
      req.session.flash = { tipo: "success", testo: testo };
    } catch (err: any) {
      req.session.flash = { tipo: "danger", testo: messaggioErrore(err) };
    }
    tornaAlDettaglio(req, res);
  };

//nuovo commento (riusa il service e la trasmissione socket.io)
export const aggiungiCommento = async (req: any, res: any) => {
  try {
    const commento = await ticketsService.aggiungiCommento(+req.params.id, req.body.testo, req.session.user.username);
    inviaCommento(+req.params.id, commento); //lo mando in tempo reale a chi sta guardando questo ticket
  } catch (err: any) {
    req.session.flash = { tipo: "danger", testo: messaggioErrore(err) };
  }
  tornaAlDettaglio(req, res);
};

//cambio stato (solo il tecnico assegnato, controlli nel service)
export const cambiaStato = applicaAzione("Stato aggiornato", req => ticketsService.aggiornaStato(+req.params.id, req.body.stato, req.session.user.username));

//assegnazione priorità (solo il tecnico assegnato, controlli nel service)
export const cambiaPriorita = applicaAzione("Priorità aggiornata", req => ticketsService.aggiornaPriorita(+req.params.id, req.body.priorita, req.session.user.username));

//prendi in carico (solo tecnico, controlli nel service)
export const prendiInCarico = applicaAzione("Ticket preso in carico", req => ticketsService.prendiInCarico(+req.params.id, req.session.user.username));

//valutazione del ticket (solo l'autore su ticket risolto, controlli nel service)
export const inviaFeedback = applicaAzione("Feedback inviato!", req => ticketsService.inviaFeedback(+req.params.id, Number(req.body.valutazione), req.session.user.username));

//modifica ticket entro 15 minuti (solo l'autore, controlli nel service)
export const modifica = async (req: any, res: any) => {
  try {
    await ticketsService.modificaTicket(+req.params.id, { titolo: req.body.titolo, descrizione: req.body.descrizione, categoria: req.body.categoria }, req.session.user.username);
    req.session.flash = { tipo: "success", testo: "Ticket aggiornato" };
    return tornaAlDettaglio(req, res);
  } catch (err: any) {
    req.session.flash = { tipo: "danger", testo: messaggioErrore(err) };
    return res.redirect("/ticket/" + req.params.id + "?modifica=1"); //resto in modifica per correggere
  }
};

//archivia ticket risolto (autore o tecnico assegnato)
export const archivia = async (req: any, res: any) => {
  try {
    await ticketsService.archiviaTicket(+req.params.id, req.session.user.username);
    req.session.flash = { tipo: "success", testo: "Ticket archiviato" };
    res.redirect("/"); //torno alla dashboard
  } catch (err: any) {
    req.session.flash = { tipo: "danger", testo: messaggioErrore(err) };
    tornaAlDettaglio(req, res);
  }
};
