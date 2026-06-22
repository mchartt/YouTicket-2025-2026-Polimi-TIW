import * as ticketsService from "../services/tickets.service"; //introduco i service per utilizzare i metodi e logica di business
import { ApiError } from "../errors/ApiError";


export const getTickets = async (req: any, res: any) => res.json(await ticketsService.getTickets(req.query)); //per ottenere i ticket
export const getStatsFeedback = async (req: any, res: any) => res.json(await ticketsService.getStatsFeedback(req.query.tecnico)); //per ottenere le statistiche dei feedback
export const getTicketDetails = async (req: any, res: any) => res.json(await ticketsService.getTicketDetails(+req.params.id)); //per ottenere i dettagli di un ticket
export const createTicket = async (req: any, res: any) => res.status(201).json(await ticketsService.createTicket({ ...req.body, autore: req.user.username })); //l'autore è chi è loggato, non quello che dice il client
//                                                                            +req.params.id per convertire in numero (equivale a parseInt(req.params.id))
export const modificaTicket = async (req: any, res: any) => res.json(await ticketsService.modificaTicket(+req.params.id, req.body, req.user.username)); //per modificare un ticket entro 15 minuti
export const archiviaTicket = async (req: any, res: any) => res.json(await ticketsService.archiviaTicket(+req.params.id)); //per archiviare un ticket risolto
export const aggiungiAllegato = async (req: any, res: any) => {
  if (!req.file) throw new ApiError(400, "Nessun file caricato"); //richiesta errata, non errore interno: rispondo 400
  const data = {
    nomeFile: req.file.originalname, //nome originale del file
    tipo: req.file.mimetype, //tipo del file
    dati: req.file.path //percorso del file
  };
  res.status(201).json(await ticketsService.aggiungiAllegato(+req.params.id, data)); //aggiungo l'allegato
};
export const scaricaAllegato = async (req: any, res: any) => { //per scaricare un allegato dal file system
  const allegato = await ticketsService.getAllegato(+req.params.allegatoId); //trovo l'allegato tramite l'id
  const nomeFileSicuro = allegato.nomeFile.replace(/"/g, "'"); //per evitare problemi con i nomi dei file
  res.setHeader("X-Content-Type-Options", "nosniff"); //per evitare problemi con i tipi di file
  res.setHeader("Content-Disposition", `attachment; filename="${nomeFileSicuro}"; filename*=UTF-8''${encodeURIComponent(allegato.nomeFile)}`); //per scaricare l'allegato
  const path = require("path"); //percorso del file
  res.sendFile(path.resolve(allegato.dati), { //invio il file
    headers: { "Content-Type": allegato.tipo || "application/octet-stream" } //header per 
  });
};
export const aggiornaPriorita = async (req: any, res: any) => res.json(await ticketsService.aggiornaPriorita(+req.params.id, req.body.priorita, req.user.username)); //per aggiornare la gravità di un ticket
export const aggiornaStato = async (req: any, res: any) => res.json(await ticketsService.aggiornaStato(+req.params.id, req.body.stato, req.user.username)); //per aggiornare lo stato di un ticket
export const prendiInCarico = async (req: any, res: any) => res.json(await ticketsService.prendiInCarico(+req.params.id, req.user.username)); //per assegnare un ticket a un tecnico
export const aggiungiCommento = async (req: any, res: any) => res.status(201).json(await ticketsService.aggiungiCommento(+req.params.id, req.body.testo, req.user.username)); //per aggiungere un commento a un ticket
export const inviaFeedback = async (req: any, res: any) => res.json(await ticketsService.inviaFeedback(+req.params.id, req.body.valutazione)); //per inviare un feedback a un ticket
