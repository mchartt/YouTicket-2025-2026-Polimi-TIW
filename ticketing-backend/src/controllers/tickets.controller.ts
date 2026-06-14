import * as ticketsService from "../services/tickets.service"; //introduco i service per utilizzare i metodi e logica di business

export const getTickets = async (req: any, res: any) => res.json(await ticketsService.getTickets(req.query)); //per ottenere i ticket
export const getStatsFeedback = async (req: any, res: any) => res.json(await ticketsService.getStatsFeedback(req.query.tecnico)); //per ottenere le statistiche dei feedback
export const getTicketDetails = async (req: any, res: any) => res.json(await ticketsService.getTicketDetails(+req.params.id)); //per ottenere i dettagli di un ticket
export const createTicket = async (req: any, res: any) => res.status(201).json(await ticketsService.createTicket(req.body)); //per creare un nuovo ticket
//                                                                            +req.params.id per convertire in numero (equivale a parseInt(req.params.id))
export const aggiornaPriorita = async (req: any, res: any) => res.json(await ticketsService.aggiornaPriorita(+req.params.id, req.body.priorita, req.body.tecnicoUsername)); //per aggiornare la gravità di un ticket
export const aggiornaStato = async (req: any, res: any) => res.json(await ticketsService.aggiornaStato(+req.params.id, req.body.stato, req.body.chiEsegueAzione)); //per aggiornare lo stato di un ticket
export const prendiInCarico = async (req: any, res: any) => res.json(await ticketsService.prendiInCarico(+req.params.id, req.body.tecnicoUsername)); //per assegnare un ticket a un tecnico
export const aggiungiCommento = async (req: any, res: any) => res.status(201).json(await ticketsService.aggiungiCommento(+req.params.id, req.body.testo, req.body.autoreUsername)); //per aggiungere un commento a un ticket
export const inviaFeedback = async (req: any, res: any) => res.json(await ticketsService.inviaFeedback(+req.params.id, req.body.valutazione)); //per inviare un feedback a un ticket
