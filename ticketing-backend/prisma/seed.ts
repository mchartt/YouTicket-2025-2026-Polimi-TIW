import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const password = "Password123!";
const cleanOnly = process.argv.includes("--clean-only");

async function main() {
  const hash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  await db.ticketComment.deleteMany();
  await db.ticketStateLog.deleteMany();
  await db.ticket.deleteMany();
  await db.categoria.deleteMany();
  await db.user.deleteMany();

  if (cleanOnly) {
    console.log("Database ripulito. Nessun dato demo inserito.");
    return;
  }

  await db.user.createMany({
    data: [
      { username: "mario.rossi", password: hash, nome: "Mario", cognome: "Rossi", email: "mario.rossi@polimi.it", ruolo: "UTENTE" },
      { username: "giulia.bianchi", password: hash, nome: "Giulia", cognome: "Bianchi", email: "giulia.bianchi@mail.polimi.it", ruolo: "UTENTE" },
      { username: "tech.matteo.cesandri", password: hash, nome: "Matteo", cognome: "Cesandri", email: "matteo.cesandri@service.polimi.it", ruolo: "TECNICO" },
      { username: "tech.luca.ferri", password: hash, nome: "Luca", cognome: "Ferri", email: "luca.ferri@service.polimi.it", ruolo: "TECNICO" }
    ]
  });

  await db.categoria.createMany({
    data: [
      { nome: "Account", colore: "#0b76d1" },
      { nome: "Hardware", colore: "#16a34a" },
      { nome: "Software", colore: "#7c3aed" },
      { nome: "Rete", colore: "#ea580c" }
    ]
  });

  const t1 = await db.ticket.create({
    data: {
      titolo: "Accesso alla rete Wi-Fi non disponibile",
      descrizione: "Non riesco ad accedere alla rete Wi-Fi del campus dal mio portatile.",
      categoria: "Rete",
      stato: "IN_ATTESA",
      autore: "mario.rossi",
      priorita: null,
      dataCreazione: now,
      dataAggiornamento: now
    }
  });

  const t2 = await db.ticket.create({
    data: {
      titolo: "Installazione software per laboratorio",
      descrizione: "Serve installare il software richiesto per l'esame nel laboratorio informatico.",
      categoria: "Software",
      stato: "PRESO_IN_CARICO",
      autore: "giulia.bianchi",
      tecnico: "tech.matteo.cesandri",
      priorita: "MEDIA",
      dataCreazione: now,
      dataAggiornamento: now
    }
  });

  const t3 = await db.ticket.create({
    data: {
      titolo: "Password istituzionale dimenticata",
      descrizione: "Ho dimenticato la password del mio account e non riesco a completare il recupero.",
      categoria: "Account",
      stato: "IN_LAVORAZIONE",
      autore: "mario.rossi",
      tecnico: "tech.luca.ferri",
      priorita: "ALTA",
      dataCreazione: now,
      dataAggiornamento: now
    }
  });

  await db.ticketStateLog.createMany({
    data: [
      { ticketId: t1.id, statoNuovo: "IN_ATTESA", cambiatoIl: now, cambiatoDa: "mario.rossi" },
      { ticketId: t2.id, statoNuovo: "IN_ATTESA", cambiatoIl: now, cambiatoDa: "giulia.bianchi" },
      { ticketId: t2.id, statoNuovo: "PRESO_IN_CARICO", cambiatoIl: now, cambiatoDa: "tech.matteo.cesandri" },
      { ticketId: t3.id, statoNuovo: "IN_ATTESA", cambiatoIl: now, cambiatoDa: "mario.rossi" },
      { ticketId: t3.id, statoNuovo: "PRESO_IN_CARICO", cambiatoIl: now, cambiatoDa: "tech.luca.ferri" },
      { ticketId: t3.id, statoNuovo: "IN_LAVORAZIONE", cambiatoIl: now, cambiatoDa: "tech.luca.ferri" }
    ]
  });

  await db.ticketComment.create({
    data: { ticketId: t3.id, testo: "Verifica avviata. Ti aggiorniamo appena possibile.", autoreUsername: "tech.luca.ferri", creatoIl: now }
  });

  console.log(`Seed completato. Password demo: ${password}`);
}

main().finally(() => db.$disconnect());
