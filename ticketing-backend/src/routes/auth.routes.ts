import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as authController from "../controllers/auth.controller";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

export const authRoutes = Router(); //creo un'istanza di Router per definire le route
//una sorta di mini server che gestisce le richieste

//DEFINIZIONE ROUTE REGISTRAZIONE
authRoutes.post("/register", asyncHandler(authController.register));
authRoutes.post("/login", asyncHandler(authController.login));

//DEFINIZIONE ROUTE AUTO-ASSEGNAZIONE
authRoutes.patch("/auto-assegnazione", requireAuth, requireRole("TECNICO"), asyncHandler(authController.toggleAutoAssegnazione));
