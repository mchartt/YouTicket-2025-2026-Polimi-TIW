import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { requireAuth } from "../middlewares/autenticazione";
import * as dashboard from "../controllers/dashboard.controller";

export const dashboardRoutes = Router(); //dashboard + auto-assegnazione (wiring → dashboard.controller)

dashboardRoutes.get("/", requireAuth, asyncHandler(dashboard.mostra));
dashboardRoutes.post("/auto-assegnazione", requireAuth, asyncHandler(dashboard.toggleAutoAssegnazione));
