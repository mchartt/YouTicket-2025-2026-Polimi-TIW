import { ZodError } from "zod";
import { ApiError } from "./ApiError";

//converte un errore nel messaggio mostrato all'utente, con gli stessi testi di errorHandler.
//serve alle pagine EJS per ri-mostrare il form con l'errore (come faceva err.message lato React).
export function messaggioErrore(err: any): string {
  if (err instanceof ApiError) return typeof err.body === "string" ? err.body : (err.body?.error || err.message);
  if (err instanceof ZodError) return "Controlla i dati inseriti: " + err.errors.map(e => e.message).join(", ");
  return "Operazione non riuscita";
}
