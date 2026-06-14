import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { categorieRoutes } from "./categorie.routes";
import { ticketsRoutes } from "./tickets.routes";

export const routes = Router(); //creo un'istanza di Router per aggregare tutte le route dei vari domini

//middleware globale per indirizzare le richieste alle route appropriate
routes.use("/auth", authRoutes);
routes.use("/categorie", categorieRoutes);
routes.use("/tickets", ticketsRoutes);
