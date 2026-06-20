import * as authService from "../services/auth.service";
import * as ticketsService from "../services/tickets.service";
import * as categorieService from "../services/categorie.service";

//handler della dashboard e dell'auto-assegnazione.

//elenco ticket + statistiche (tecnico) con filtri e sezione attivi/archivio
export const mostra = async (req: any, res: any) => {
  const user = req.session.user;
  const vista = req.query.vista === "archivio" ? "archivio" : "attivi"; //sezione corrente: ticket attivi o archivio

  //valori dei filtri così come arrivano dal form (Option A: si applicano col bottone "Filtra")
  const filtri = {
    q: req.query.q || "",
    stato: req.query.stato || "",
    categoria: req.query.categoria || "",
    priorita: req.query.priorita || "",
    tecnico: req.query.tecnico || ""
  };

  //ricostruisco la query per il service identica a quella che faceva il frontend
  const queryService: any = {
    ...filtri,
    archiviato: vista === "archivio" ? "true" : "false" //archivio o ticket attivi
  };
  if (user.ruolo === "UTENTE") queryService.autore = user.username; //l'utente vede solo i propri ticket

  const tickets = await ticketsService.getTickets(queryService);
  const categorie = await categorieService.getCategorie(true);

  //il tecnico vede la media delle valutazioni dei suoi ticket e di quelli del team
  let statsMie = null, statsTeam = null;
  if (user.ruolo === "TECNICO") {
    statsMie = await ticketsService.getStatsFeedback(user.username);
    statsTeam = await ticketsService.getStatsFeedback();
  }

  //query string dei filtri attivi, per conservarli quando si cambia sezione Attivi/Archivio
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filtri)) if (v) params.set(k, String(v));
  const filtriQS = params.toString();

  res.render("pagine/dashboard", { titolo: "YouTicket", tickets, categorie, statsMie, statsTeam, vista, filtri, filtriQS });
};

//attiva/disattiva auto-assegnazione (solo tecnico)
export const toggleAutoAssegnazione = async (req: any, res: any) => {
  const attiva = req.body.attiva === "true"; //il bottone manda già il valore nuovo (opposto di quello attuale)
  await authService.toggleAutoAssegnazione(req.session.user.username, attiva);
  req.session.user.autoAssegnazione = attiva; //tengo aggiornata la sessione
  req.session.flash = { tipo: "success", testo: attiva ? "Auto-assegnazione attivata" : "Auto-assegnazione disattivata" };
  res.redirect(req.get("Referer") || "/"); //torno alla dashboard mantenendo vista/filtri
};
