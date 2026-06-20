import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as ticketsController from "../controllers/tickets.controller";

export const ticketsRoutes = Router(); //creo un'istanza di Router per definire le route

//DEFINIZIONE ROUTE TICKET
ticketsRoutes.get("/search", asyncHandler(ticketsController.getTickets));
ticketsRoutes.get("/stats/feedback", asyncHandler(ticketsController.getStatsFeedback));
ticketsRoutes.get("/:id/allegati/:allegatoId/download", asyncHandler(ticketsController.scaricaAllegato));
ticketsRoutes.get("/:id", asyncHandler(ticketsController.getTicketDetails));
ticketsRoutes.post("/", asyncHandler(ticketsController.createTicket));
ticketsRoutes.patch("/:id/priorita", asyncHandler(ticketsController.aggiornaPriorita));
ticketsRoutes.patch("/:id/stato", asyncHandler(ticketsController.aggiornaStato));
ticketsRoutes.patch("/:id/assegna", asyncHandler(ticketsController.prendiInCarico));
ticketsRoutes.patch("/:id/archivia", asyncHandler(ticketsController.archiviaTicket));
ticketsRoutes.patch("/:id", asyncHandler(ticketsController.modificaTicket));
ticketsRoutes.post("/:id/commenti", asyncHandler(ticketsController.aggiungiCommento));
ticketsRoutes.post("/:id/allegati", asyncHandler(ticketsController.aggiungiAllegato));
ticketsRoutes.post("/:id/feedback", asyncHandler(ticketsController.inviaFeedback));
