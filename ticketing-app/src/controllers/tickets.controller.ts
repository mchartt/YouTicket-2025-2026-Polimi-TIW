import * as ticketsService from "../services/tickets.service"; //introduco i service per utilizzare i metodi e logica di business
import { ApiError } from "../errors/ApiError";

export const scaricaAllegato = async (req: any, res: any) => { //per scaricare un allegato con il giusto tipo di contenuto
  const a = await ticketsService.getAllegato(+req.params.allegatoId);
  //autorizzazione: un UTENTE può scaricare solo allegati di ticket suoi (il tecnico vede tutto)
  const user = req.session.user;
  const ticket = await ticketsService.getTicketDetails(a.ticketId);
  if (user.ruolo === "UTENTE" && ticket.autore !== user.username) throw new ApiError(403, "Non autorizzato");
  const base64 = a.dati.split(",").pop() || ""; //rimuovo il prefisso "data:...;base64," dal data URL
  res.setHeader("Content-Type", a.tipo || "application/octet-stream");
  res.setHeader("X-Content-Type-Options", "nosniff"); //evito il MIME sniffing su file caricati dagli utenti
  res.setHeader("Content-Disposition", `attachment; filename="${a.nomeFile.replace(/"/g, "'")}"; filename*=UTF-8''${encodeURIComponent(a.nomeFile)}`); //nome file robusto anche con apici o accenti
  res.send(Buffer.from(base64, "base64"));
};
