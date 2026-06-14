import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "../config/db";
import { ApiError } from "../errors/ApiError";
import { registerZ } from "../schemas/auth.schema";
import { assegnaInAttesa } from "./tickets.service";

//DEFINISCO DEGLI UTILS
const clean = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "."); //funzione per pulire il nome e il cognome
const baseUsername = (nome: string, cognome: string, ruolo: string) => { //per generare un username univoco
  const u = [clean(nome), clean(cognome)].filter(Boolean).join("."); //join per concatenare i valori con un punto || filter(Boolean) per rimuovere i valori vuoti
  return ruolo === "TECNICO" && u ? `tech.${u}` : u; //se è tecnico, aggiungo tech. al nome
};

//DEFINISCO LE FUNZIONI --> la maggior parte delle funzioni sono solo per estrapolare dati dal db

async function prossimoUsername(nome: string, cognome: string, ruolo: string) { //per generare un username univoco
  const base = baseUsername(nome, cognome, ruolo); //genero un base username
  if (!base) return "nome.cognome"; //se non ho nome o cognome, uso il nome di default
  let username = base, i = 1;
  while (await db.user.findFirst({ where: { username } })) username = `${base}${++i}`; //se il username esiste, aggiungo un numero alla fine || ++i per incrementare il numero
  return username;
}

export async function previewUsername(nome: string, cognome: string, ruolo: string) {
  if (!clean(nome) || !clean(cognome)) return { username: ruolo === "TECNICO" ? "tech.nome.cognome" : "nome.cognome" }; //se non ho nome o cognome, uso il nome di default
  return { username: await prossimoUsername(nome, cognome, ruolo) };
}

export async function register(data: z.infer<typeof registerZ>) { //mi assicuro che i dati in ingresso siano validi e seguano lo schema già definito
  const validEmail = data.ruolo === "TECNICO" ? /^[a-z0-9.]+@service\.polimi\.it$/i.test(data.email) : /^[a-z0-9.]+@(mail\.)?polimi\.it$/i.test(data.email);
  if (!validEmail) throw new ApiError(400, "Formato email non valido per il ruolo");
  if (await db.user.findFirst({ where: { email: { equals: data.email, mode: "insensitive" } } })) throw new ApiError(409, "Email già registrata");

  const username = await prossimoUsername(data.nome, data.cognome, data.ruolo); //genero un username univoco
  const user = await db.user.create({ data: { username, password: await bcrypt.hash(data.password, 10), nome: data.nome, cognome: data.cognome, email: data.email, ruolo: data.ruolo } });
  return { id: user.id, username: user.username, ruolo: user.ruolo, nome: user.nome };
}

export async function login(username: string, pass: string) {
  const u = await db.user.findFirst({ where: { username: { equals: username.trim(), mode: "insensitive" } } });
  if (!u || !(await bcrypt.compare(pass, u.password))) throw new ApiError(401, "Credenziali non valide"); //se l'utente non esiste o la password non è corretta, lancio un errore
  return { id: u.id, username: u.username, ruolo: u.ruolo, nome: u.nome, autoAssegnazione: u.autoAssegnazione };
}

export async function toggleAutoAssegnazione(username: string, attiva: boolean) { //per attivare o disattivare l'auto-assegnazione
  await db.user.update({ where: { username }, data: { autoAssegnazione: attiva } }); //per aggiornare l'auto-assegnazione dell'utente
  if (attiva) await assegnaInAttesa(); //se l'auto-assegnazione è attiva, assegniamo i ticket in attesa
  return { attiva };
}
