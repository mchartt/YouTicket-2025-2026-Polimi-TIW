import { z } from "zod";

//DEFINIZIONE SCHEMA REGISTRAZIONE
export const registerZ = z.object({ //definisco e chiamo lo schema manco fossi Ancellotti (sto scherzando)
  password: z.string({ required_error: "Password richiesta" }).min(8, "La password deve avere almeno 8 caratteri"),
  nome: z.string({ required_error: "Nome richiesto" }).min(1, "Nome richiesto"),
  cognome: z.string({ required_error: "Cognome richiesto" }).min(1, "Cognome richiesto"),
  email: z.string({ required_error: "Email richiesta" }).email("Formato email non valido"),
  ruolo: z.enum(["UTENTE", "TECNICO"], { errorMap: () => ({ message: "Ruolo non valido" }) })
});
