import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as authController from "../controllers/auth.controller";

export const authRoutes = Router(); //creo un'istanza di Router per definire le route
//una sorta di mini server che gestisce le richieste

//DEFINIZIONE ROUTE REGISTRAZIONE
authRoutes.post("/register", asyncHandler(authController.register));
authRoutes.get("/preview-username", asyncHandler(authController.previewUsername));
authRoutes.post("/login", asyncHandler(authController.login));

//DEFINIZIONE ROUTE AUTO-ASSEGNAZIONE
authRoutes.patch("/auto-assegnazione", asyncHandler(authController.toggleAutoAssegnazione));
