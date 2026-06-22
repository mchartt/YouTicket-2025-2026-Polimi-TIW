import * as authService from "../services/auth.service"; //introduco i service per utilizzare i metodi e logica di business
import { registerZ, loginZ } from "../schemas/auth.schema";

//                                                                       VALIDO IL BODY CON LO SCHEMA ZOD E PASSO IL BODY VALIDATO ALLA FUNZIONE REGISTER
export const register = async (req: any, res: any) => res.status(201).json(await authService.register(registerZ.parse(req.body))); //per registrare un nuovo utente
//                                           VALIDO IL BODY E PASSO I PARAMETRI ALLA FUNZIONE LOGIN
export const login = async (req: any, res: any) => {
  const { username, password } = loginZ.parse(req.body);
  return res.json(await authService.login(username, password));
}; //per loggarsi
export const toggleAutoAssegnazione = async (req: any, res: any) => res.json(await authService.toggleAutoAssegnazione(req.user.username, !!req.body.attiva)); //per attivare o disattivare l'auto-assegnazione
