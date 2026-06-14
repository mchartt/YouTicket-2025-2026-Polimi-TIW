import "dotenv/config";
import express from "express";
import cors from "cors";
import { db, bootstrapDb } from "./config/db";
import { routes } from "./routes";
import { errorHandler } from "./errors/errorHandler"; //importo il middleware globale per gestire gli errori

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
  const corsOrigin = process.env.CORS_ORIGIN || "*"; //per permettere alle richieste di venire da altre origini
  const origins = corsOrigin === "*" ? "*" : corsOrigin.split(",").map(s => s.trim());
  app.use(cors({ origin: origins })); //per permettere alle richieste di venire da altre origini
  app.use(express.json({ limit: "15mb" })); //per poter leggere il body delle richieste in formato json (limite alzato per gli allegati)

  app.get("/health", (_req, res) => { res.json({ ok: true }); }); //per verificare se il server è attivo || middleware per verificare la salute del server
  app.use("/api", routes); //le route sono definite in routes/ || middleware globale per indirizzare le richieste alle route appropriate

  app.use((_req, res) => res.status(404).json({ error: "Risorsa non trovata" })); //rispondo sempre in JSON anche per le route inesistenti
  app.use(errorHandler); //middleware globale per gestire gli errori

  const port = process.env.PORT || 8080; //prendo la porta dalle variabili d'ambiente se non è definita uso 8080
  const server = app.listen(port, () => console.log(`API Listening on ${port}`)); //avvio del server con utilizzo porta in modo dinamico

  process.on("SIGINT", async () => { await db.$disconnect(); server.close(); }); //per disconnettersi dal db e chiudere il server
}

main().catch(console.error);
