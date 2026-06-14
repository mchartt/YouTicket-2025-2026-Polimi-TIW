import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as categorieController from "../controllers/categorie.controller";

export const categorieRoutes = Router(); //creo un'istanza di Router per definire le route

//DEFINIZIONE ROUTE CATEGORIE
categorieRoutes.get("/", asyncHandler(categorieController.getCategorie));
categorieRoutes.post("/", asyncHandler(categorieController.creaCategoria));
categorieRoutes.patch("/:id/attivo", asyncHandler(categorieController.toggleCategoria));
categorieRoutes.delete("/:id", asyncHandler(categorieController.eliminaCategoria));
