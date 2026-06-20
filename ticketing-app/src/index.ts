import "dotenv/config";
import path from "path";
import crypto from "crypto";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

//firma il sid come fa express-session (cookie-signature): valore + "." + HMAC-sha256 base64 senza padding
function firmaSid(val: string, secret: string) {
  return val + "." + crypto.createHmac("sha256", secret).update(val).digest("base64").replace(/=+$/, "");
}

//mappa stato -> classi badge Bootstrap, condivisa fra le viste (dashboard e dettaglio ticket)
const COLORE_STATO: Record<string, string> = {
  IN_ATTESA: "bg-danger-subtle text-danger-emphasis",
  PRESO_IN_CARICO: "bg-warning-subtle text-warning-emphasis",
  IN_LAVORAZIONE: "bg-secondary-subtle text-primary-emphasis",
  RISOLTO: "bg-success-subtle text-success-emphasis"
};
import { db, bootstrapDb } from "./config/db";
import { routes } from "./routes";
import { pagineRoutes } from "./routes/pagine.routes"; //pagine EJS renderizzate dal server
import { errorHandler } from "./errors/errorHandler"; //importo il middleware globale per gestire gli errori
import { initWs } from "./websocket-server"; //server WebSocket per la chat in tempo reale

async function waitForDatabase(maxRetries = 30) { //provo 30 volte a connettermi al db se non risponde chiudo
  for (let i = 0; i < maxRetries; i++) {
    try {
      await db.$queryRaw`SELECT 1`; //provo a fare una query al db per vedere se è pronto
      console.log("[db] Database is ready");
      return;
    } catch {
      console.log(`[db] Waiting for database... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Database did not become ready in time");
}

async function main() { //mentre aspetto che il db sia pronto porto avanti altre task
  await waitForDatabase(); //per aspettare che il db sia pronto
  await db.$connect(); //per ottenere la connessione fisica al db | il dollaro serve solo per evitare errodi di sovrapposizione di nomenclatura con le funzioni di prisma
  await bootstrapDb(); //creazione categorie di default

  const app = express();
  app.disable("etag"); //disabilito ETag così le GET dell'API rispondono sempre 200 con dati freschi (niente 304)
  app.disable("x-powered-by"); //non espongo il framework usato (header X-Powered-By)

  //EJS: motore di template e cartella delle viste
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));

  //file statici (css, logo) serviti dal server
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.use(express.json({ limit: "15mb" })); //per poter leggere il body delle richieste in formato json (limite alzato per gli allegati)
  app.use(express.urlencoded({ extended: true, limit: "15mb" })); //per leggere i dati dei form HTML inviati dalle pagine EJS

  //sessione identificata dal ?sid nella URL invece che dal cookie del browser:
  //così due finestre dello stesso browser (cookie unico e condiviso) restano sessioni distinte.
  const SESSION_SECRET = process.env.SESSION_SECRET || "youticket-dev-secret";

  //prima di express-session ricostruisco il cookie dal ?sid della URL e ignoro quello vero del browser
  app.use((req, _res, next) => {
    const sid = typeof req.query.sid === "string" ? req.query.sid : "";
    req.headers.cookie = sid ? "connect.sid=s:" + firmaSid(sid, SESSION_SECRET) : "";
    next();
  });

  //sessione: tiene l'utente loggato (sostituisce il localStorage del frontend React)
  //store su Postgres (riusa DATABASE_URL): le sessioni sopravvivono ai restart e non riempiono la RAM
  const PgStore = connectPgSimple(session);
  app.use(session({
    store: new PgStore({ conString: process.env.DATABASE_URL, createTableIfMissing: true }), //crea da sola la tabella "session"
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 } //cookie valido 24h
  }));

  //rendo utente, notifica flash, sid e helper url() disponibili in ogni vista; la flash si consuma una volta sola
  app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;

    res.locals.sid = req.sessionID; //usato dalle viste per propagare la sessione
    res.locals.COLORE_STATO = COLORE_STATO; //classi badge per stato, condivise tra le viste
    res.locals.etichettaStato = (s: string) => s.replace(/_/g, " "); //stato leggibile (IN_ATTESA -> "IN ATTESA")
    //helper: aggiunge ?sid (o &sid) a un percorso interno; lascia stare URL esterni e le /api
    const u = (p: any) => {
      if (typeof p !== "string" || /^https?:\/\//i.test(p) || p.startsWith("/api/")) return p;
      return p + (p.includes("?") ? "&" : "?") + "sid=" + encodeURIComponent(req.sessionID);
    };
    res.locals.u = u;

    //ogni redirect interno porta con sé il sid (così non perdo la sessione dopo i POST)
    const redirect = res.redirect.bind(res);
    (res as any).redirect = (url: string) => redirect(u(url));

    next();
  });

  app.get("/health", (_req, res) => { res.json({ ok: true }); }); //per verificare se il server è attivo || middleware per verificare la salute del server
  app.use("/api", routes); //le route REST restano disponibili (usate anche dalla chat WebSocket)
  app.use("/", pagineRoutes); //pagine EJS

  app.use((_req, res) => res.status(404).json({ error: "Risorsa non trovata" })); //rispondo sempre in JSON anche per le route inesistenti
  app.use(errorHandler); //middleware globale per gestire gli errori

  const port = process.env.PORT || 8080; //prendo la porta dalle variabili d'ambiente se non è definita uso 8080
  const server = app.listen(port, () => console.log(`App listening on ${port}`)); //avvio del server con utilizzo porta in modo dinamico
  initWs(server); //la chat usa WebSocket sullo stesso server/porta

  process.on("SIGINT", async () => { await db.$disconnect(); server.close(); }); //per disconnettersi dal db e chiudere il server
}

main().catch(console.error);
