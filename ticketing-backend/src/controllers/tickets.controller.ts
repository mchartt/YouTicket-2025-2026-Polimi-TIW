import * as ticketsService from "../services/tickets.service"; //introduco i service per utilizzare i metodi e logica di business
import { inviaCommento } from "../websocket-server"; //per trasmettere i nuovi commenti via WebSocket

export const getTickets = async (req: any, res: any) => res.json(await ticketsService.getTickets(req.query)); //per ottenere i ticket
export const getStatsFeedback = async (req: any, res: any) => res.json(await ticketsService.getStatsFeedback(req.query.tecnico)); //per ottenere le statistiche dei feedback
export const getTicketDetails = async (req: any, res: any) => res.json(await ticketsService.getTicketDetails(+req.params.id)); //per ottenere i dettagli di un ticket
export const createTicket = async (req: any, res: any) => res.status(201).json(await ticketsService.createTicket(req.body)); //per creare un nuovo ticket
//                                                                            +req.params.id per convertire in numero (equivale a parseInt(req.params.id))
export const modificaTicket = async (req: any, res: any) => res.json(await ticketsService.modificaTicket(+req.params.id, req.body, req.body.autore)); //per modificare un ticket entro 15 minuti
export const archiviaTicket = async (req: any, res: any) => res.json(await ticketsService.archiviaTicket(+req.params.id)); //per archiviare un ticket risolto
export const aggiungiAllegato = async (req: any, res: any) => res.status(201).json(await ticketsService.aggiungiAllegato(+req.params.id, req.body)); //per caricare un allegato
export const eliminaAllegato = async (req: any, res: any) => { await ticketsService.eliminaAllegato(+req.params.id, +req.params.allegatoId); res.sendStatus(204); }; //per cancellare un allegato
export const scaricaAllegato = async (req: any, res: any) => { //per scaricare un allegato con il giusto tipo di contenuto
  const a = await ticketsService.getAllegato(+req.params.allegatoId);
  const base64 = a.dati.split(",").pop() || ""; //rimuovo il prefisso "data:...;base64," dal data URL
  res.setHeader("Content-Type", a.tipo || "application/octet-stream");
  res.setHeader("X-Content-Type-Options", "nosniff"); //evito il MIME sniffing su file caricati dagli utenti
  res.setHeader("Content-Disposition", `attachment; filename="${a.nomeFile.replace(/"/g, "'")}"; filename*=UTF-8''${encodeURIComponent(a.nomeFile)}`); //nome file robusto anche con apici o accenti
  res.send(Buffer.from(base64, "base64"));
};
export const aggiornaPriorita = async (req: any, res: any) => res.json(await ticketsService.aggiornaPriorita(+req.params.id, req.body.priorita, req.body.tecnicoUsername)); //per aggiornare la gravità di un ticket
export const aggiornaStato = async (req: any, res: any) => res.json(await ticketsService.aggiornaStato(+req.params.id, req.body.stato, req.body.chiEsegueAzione)); //per aggiornare lo stato di un ticket
export const prendiInCarico = async (req: any, res: any) => res.json(await ticketsService.prendiInCarico(+req.params.id, req.body.tecnicoUsername)); //per assegnare un ticket a un tecnico
export const aggiungiCommento = async (req: any, res: any) => { //per aggiungere un commento a un ticket
  const commento = await ticketsService.aggiungiCommento(+req.params.id, req.body.testo, req.body.autoreUsername);
  inviaCommento(+req.params.id, commento); //lo mando in tempo reale a chi sta guardando questo ticket
  res.status(201).json(commento);
};
export const inviaFeedback = async (req: any, res: any) => res.json(await ticketsService.inviaFeedback(+req.params.id, req.body.valutazione)); //per inviare un feedback a un ticket
