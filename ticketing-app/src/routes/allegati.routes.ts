import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth } from "../middlewares/autenticazione";
import * as allegati from "../controllers/allegati.controller";

export const allegatiRoutes = Router(); //API REST allegati (montata sotto /api/tickets)

//download allegato: richiede login; l'autorizzazione fine (UTENTE solo i suoi) è in scaricaAllegato
allegatiRoutes.get("/:id/allegati/:allegatoId/download", requireAuth, asyncHandler(allegati.scaricaAllegato));
