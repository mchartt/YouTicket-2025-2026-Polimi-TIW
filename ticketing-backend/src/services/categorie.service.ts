import { db } from "../config/db";
import { ApiError } from "../errors/ApiError";

export async function getCategorie(soloAttive = false) {
  return db.categoria.findMany({ where: soloAttive ? { attivo: true } : undefined, orderBy: { nome: "asc" } }); //per ottenere le categorie || orderBy per ordinare le categorie per nome in ordine alfabetico
}

export async function creaCategoria(nome: string) {
  if (await db.categoria.findFirst({ where: { nome: { equals: nome, mode: "insensitive" } } })) throw new ApiError(409, "Categoria esistente");
  return db.categoria.create({ data: { nome, attivo: true } }); //per creare una nuova categoria
}

export async function toggleCategoria(id: number, attivo: boolean) { //per attivare o disattivare una categoria
  return db.categoria.update({ where: { id }, data: { attivo } }); //per aggiornare la categoria
}

export async function eliminaCategoria(id: number) {
  const c = await db.categoria.findUnique({ where: { id } });
  if (!c) return;
  if ((await db.ticket.count({ where: { categoria: c.nome } })) > 0) return db.categoria.update({ where: { id }, data: { attivo: false } }); //se il ticket è associato a una categoria, non la elimino
  return db.categoria.delete({ where: { id } }); //per eliminare la categoria
}
