import { messaggioErrore } from "../errors/messaggioErrore";
import * as authService from "../services/auth.service";
import { registerZ } from "../schemas/auth.schema";

//handler delle pagine di accesso: login, registrazione, logout.
//logica di business in auth.service; qui solo orchestrazione HTTP (sessione, flash, render).

//pagina di login
export const mostraLogin = (req: any, res: any) => {
  if (req.session.user) return res.redirect("/"); //se già loggato vado alla home
  res.render("pagine/login", { titolo: "Accedi - YouTicket", modo: "login", errore: null, valori: {} });
};

//pagina di registrazione (stessa vista, modalità diversa)
export const mostraRegistrazione = (req: any, res: any) => {
  if (req.session.user) return res.redirect("/");
  res.render("pagine/login", { titolo: "Registrati - YouTicket", modo: "registrazione", errore: null, valori: { ruolo: "UTENTE" } });
};

//invio del form di login
export const login = async (req: any, res: any) => {
  try {
    req.session.user = await authService.login(req.body.username, req.body.password);
    req.session.flash = { tipo: "success", testo: "Accesso effettuato" };
    res.redirect("/");
  } catch (err: any) {
    res.render("pagine/login", { titolo: "Accedi - YouTicket", modo: "login", errore: messaggioErrore(err), valori: { username: req.body.username } });
  }
};

//invio del form di registrazione
export const registra = async (req: any, res: any) => {
  try {
    req.session.user = await authService.register(registerZ.parse(req.body)); //valido col solito schema Zod e registro
    req.session.flash = { tipo: "success", testo: "Registrazione completata" };
    res.redirect("/");
  } catch (err: any) {
    res.render("pagine/login", { titolo: "Registrati - YouTicket", modo: "registrazione", errore: messaggioErrore(err), valori: { nome: req.body.nome, cognome: req.body.cognome, email: req.body.email, ruolo: req.body.ruolo } });
  }
};

//logout: chiudo la sessione e torno al login
export const logout = (req: any, res: any) => {
  req.session.destroy(() => res.redirect("/login"));
};
