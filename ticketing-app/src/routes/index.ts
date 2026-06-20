import { Router } from "express";
import { allegatiRoutes } from "./allegati.routes";

export const routes = Router(); //aggrega le route REST ancora attive (montate sotto /api)

//URL risultante: /api/tickets/:id/allegati/:allegatoId/download (allegato annidato sotto il ticket)
routes.use("/tickets", allegatiRoutes);
