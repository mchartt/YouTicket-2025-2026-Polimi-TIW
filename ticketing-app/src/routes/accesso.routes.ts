import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as accesso from "../controllers/accesso.controller";

export const accessoRoutes = Router(); //login, registrazione, logout (wiring → accesso.controller)

accessoRoutes.get("/login", asyncHandler(accesso.mostraLogin));
accessoRoutes.get("/registrazione", asyncHandler(accesso.mostraRegistrazione));
accessoRoutes.post("/login", asyncHandler(accesso.login));
accessoRoutes.post("/registrazione", asyncHandler(accesso.registra));
accessoRoutes.post("/logout", asyncHandler(accesso.logout));
