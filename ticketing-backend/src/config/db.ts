import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient(); //creo un'istanza di PrismaClient per interagire con il db
//FUNZIONE DI AVVIO CHE CREA LE CATEGORIE DI DEFAULT
export async function bootstrapDb() { //sync si mette di norma per le funzioni che richiedono parecchio tempo per essere eseguite
  //poiché nodejs è a single thread, non può eseguire più funzioni alla volta e le mette in background insomma
  const count = await db.categoria.count();  //await serve per aspettare che la funzione sia completata prima di continuare
  if (count === 0) {
    await db.categoria.createMany({ //creo all'avvio del db le categorie di default altriemnti non potrei creare ticket
      data: [
        { nome: "Hardware", colore: "#0066ff" },
        { nome: "Software", colore: "#7c3aed" },
        { nome: "Rete", colore: "#059669" },
        { nome: "Account", colore: "#d97706" }
      ]
    });
    console.log("[db] Categorie base create.");
  }
}
