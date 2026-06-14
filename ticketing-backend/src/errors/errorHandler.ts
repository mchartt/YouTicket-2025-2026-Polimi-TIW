import { ApiError } from "./ApiError"; //importo la classe ApiError per gestire gli errori API
import { ZodError } from "zod"; //importo la classe ZodError per gestire gli errori di validazione

export function errorHandler(err: any, _req: any, res: any, _next: any) { //qui lancio errori personalizzati || middleware globale per gestire gli errori
  if (err instanceof ApiError) return res.status(err.status).json({ error: err.message, body: err.body }); //per gestire gli errori API | restituisco 2 tasche dell'errore (message e body sottoforma di json)
  if (err instanceof ZodError) { //qui invece mi assicuro di gestire errori di validazione su dati mal formattati
    const msg = err.errors.map(e => e.message).join(". ");  //converto tutti gli errori in una array e li unisco con un punto
    return res.status(400).json({ error: msg, details: err.errors }); //per gestire gli errori di validazione e restituisco l'errore
  }
  console.error("[Server Error]", err); //per gestire gli errori interni
  res.status(500).json({ error: "Internal Server Error" });
}
