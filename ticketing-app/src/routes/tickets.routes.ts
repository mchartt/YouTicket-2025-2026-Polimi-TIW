import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth } from "../middlewares/autenticazione";
import * as ticketsController from "../controllers/tickets.controller";

export const ticketsRoutes = Router(); //creo un'istanza di Router per definire le route

//richiede login; l'autorizzazione  avviene dentro scaricaAllegato.
ticketsRoutes.get("/:id/allegati/:allegatoId/download", requireAuth, asyncHandler(ticketsController.scaricaAllegato));
