import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as categorieController from "../controllers/categorie.controller";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

export const categorieRoutes = Router(); //creo un'istanza di Router per definire le route

categorieRoutes.use(requireAuth);

//DEFINIZIONE ROUTE CATEGORIE
//la lettura è per tutti (serve a creare i ticket), la gestione è riservata ai tecnici
categorieRoutes.get("/", asyncHandler(categorieController.getCategorie));
categorieRoutes.post("/", requireRole("TECNICO"), asyncHandler(categorieController.creaCategoria));
categorieRoutes.patch("/:id", requireRole("TECNICO"), asyncHandler(categorieController.modificaCategoria));
categorieRoutes.delete("/:id", requireRole("TECNICO"), asyncHandler(categorieController.eliminaCategoria));
