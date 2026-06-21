import { z } from "zod";

//DEFINIZIONE SCHEMA REGISTRAZIONE
export const registerZ = z.object({ //definisco e chiamo lo schema manco fossi Ancellotti (sto scherzando)
  password: z.string({ required_error: "password mancante" }).min(8, "password troppo corta (minimo 8 caratteri)"),
  nome: z.string({ required_error: "nome mancante" }).trim().min(1, "nome mancante"),
  cognome: z.string({ required_error: "cognome mancante" }).trim().min(1, "cognome mancante"),
  email: z.string({ required_error: "email mancante" }).trim().email("email non valida"),
  ruolo: z.enum(["UTENTE", "TECNICO"], { errorMap: () => ({ message: "ruolo non valido" }) })
});

//DEFINIZIONE SCHEMA LOGIN
export const loginZ = z.object({
  username: z.string({ required_error: "username mancante" }).trim().min(1, "username mancante"),
  password: z.string({ required_error: "password mancante" }).min(8, "password troppo corta (minimo 8 caratteri)")
});
