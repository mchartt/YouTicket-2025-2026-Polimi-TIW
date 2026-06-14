import * as authService from "../services/auth.service"; //introduco i service per utilizzare i metodi e logica di business
import { registerZ } from "../schemas/auth.schema";

//                                                                       VALIDO IL BODY CON LO SCHEMA ZOD E PASSO IL BODY VALIDATO ALLA FUNZIONE REGISTER
export const register = async (req: any, res: any) => res.status(201).json(await authService.register(registerZ.parse(req.body))); //per registrare un nuovo utente
//                                              PASSO I PARAMETRI ALLA FUNZIONE PREVIEWUSERNAME, SE NON SONO DEFINITI USA I VALORI DI DEFAULT ||String() per convertire in stringa || serve nei casi http://tuosito.com/api/auth/preview-username?cognome=Rossi (qui ad esempio manca il nome e avrei undefined altrimenti)
export const previewUsername = async (req: any, res: any) => res.json(await authService.previewUsername(String(req.query.nome || ""), String(req.query.cognome || ""), String(req.query.ruolo || "UTENTE"))); //per vedere se il username è disponibile
//                                           PASSO I PARAMETRI ALLA FUNZIONE LOGIN
export const login = async (req: any, res: any) => res.json(await authService.login(req.body.username, req.body.password)); //per loggarsi
export const toggleAutoAssegnazione = async (req: any, res: any) => res.json(await authService.toggleAutoAssegnazione(req.body.tecnicoUsername, !!req.body.attiva)); //per attivare o disattivare l'auto-assegnazione
