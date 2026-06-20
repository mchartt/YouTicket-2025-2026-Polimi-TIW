import { Router } from "express";
import { accessoRoutes } from "./accesso.routes";
import { dashboardRoutes } from "./dashboard.routes";
import { ticketRoutes } from "./ticket.routes";

//aggregatore delle route delle pagine EJS (montate sotto "/"): le raccoglie per dominio
export const pagineRoutes = Router();

pagineRoutes.use(accessoRoutes);   //login, registrazione, logout
pagineRoutes.use(dashboardRoutes); //dashboard, auto-assegnazione
pagineRoutes.use(ticketRoutes);    //nuova richiesta, dettaglio, azioni
