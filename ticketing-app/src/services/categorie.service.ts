import { db } from "../config/db";

export async function getCategorie(soloAttive = false) {
  return db.categoria.findMany({ where: soloAttive ? { attivo: true } : undefined, orderBy: { nome: "asc" } }); //per ottenere le categorie || orderBy per ordinare le categorie per nome in ordine alfabetico
}
