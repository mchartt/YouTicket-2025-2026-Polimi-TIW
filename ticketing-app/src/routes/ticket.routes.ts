import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth } from "../middlewares/autenticazione";
import { caricaAllegati } from "../middlewares/caricamentoFile";
import * as ticket from "../controllers/ticket.controller";

export const ticketRoutes = Router(); //nuova richiesta, dettaglio e azioni (wiring → ticket.controller)

//nuova richiesta
ticketRoutes.get("/ticket/nuovo", requireAuth, asyncHandler(ticket.mostraNuovo));
ticketRoutes.post("/ticket/nuovo", requireAuth, caricaAllegati, asyncHandler(ticket.crea));

//dettaglio + azioni
ticketRoutes.get("/ticket/:id", requireAuth, asyncHandler(ticket.mostra));
ticketRoutes.post("/ticket/:id/commenti", requireAuth, asyncHandler(ticket.aggiungiCommento));
ticketRoutes.post("/ticket/:id/stato", requireAuth, asyncHandler(ticket.cambiaStato));
ticketRoutes.post("/ticket/:id/priorita", requireAuth, asyncHandler(ticket.cambiaPriorita));
ticketRoutes.post("/ticket/:id/assegna", requireAuth, asyncHandler(ticket.prendiInCarico));
ticketRoutes.post("/ticket/:id/modifica", requireAuth, asyncHandler(ticket.modifica));
ticketRoutes.post("/ticket/:id/archivia", requireAuth, asyncHandler(ticket.archivia));
ticketRoutes.post("/ticket/:id/feedback", requireAuth, asyncHandler(ticket.inviaFeedback));
