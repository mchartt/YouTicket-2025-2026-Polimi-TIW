import { ApiError } from "./ApiError"; //importo la classe ApiError per gestire gli errori API
import { ZodError } from "zod"; //importo la classe ZodError per gestire gli errori di validazione
import { messaggioErrore } from "./messaggioErrore"; //stesso testo utente usato dalle pagine EJS

export function errorHandler(err: any, _req: any, res: any, _next: any) { //qui lancio errori personalizzati || middleware globale per gestire gli errori
  if (err instanceof ApiError) return res.status(err.status).json({ error: err.message, body: err.body }); //per gestire gli errori API | restituisco 2 tasche dell'errore (message e body sottoforma di json)
  if (err instanceof ZodError) return res.status(400).json({ error: messaggioErrore(err), details: err.errors }); //errori di validazione: stesso messaggio leggibile delle pagine
  if (err.status === 413) return res.status(413).json({ error: "File troppo grande" }); //body oltre il limite di express.json
  console.error("[Server Error]", err); //per gestire gli errori interni
  res.status(500).json({ error: "Internal Server Error" });
}
