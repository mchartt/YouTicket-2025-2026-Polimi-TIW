import { db } from "../config/db";
import { ApiError } from "../errors/ApiError";

export async function getCategorie() {
  return db.categoria.findMany({ orderBy: { nome: "asc" } }); //per ottenere le categorie ordinate per nome in ordine alfabetico
}

export async function creaCategoria(nome: string) {
  if (!nome || !nome.trim()) throw new ApiError(400, "Nome categoria obbligatorio");
  if (await db.categoria.findFirst({ where: { nome: { equals: nome, mode: "insensitive" } } })) throw new ApiError(409, "Categoria esistente");
  return db.categoria.create({ data: { nome } }); //per creare una nuova categoria
}

export async function modificaCategoria(id: number, nome: string) { //per rinominare una categoria
  if (!nome || !nome.trim()) throw new ApiError(400, "Nome categoria obbligatorio");
  nome = nome.trim();
  const c = await db.categoria.findUnique({ where: { id } });
  if (!c) throw new ApiError(404, "Categoria non trovata"); //evito il 500 (P2025) su id inesistente
  if (await db.categoria.findFirst({ where: { nome: { equals: nome, mode: "insensitive" }, id: { not: id } } })) throw new ApiError(409, "Categoria esistente"); //un'altra categoria ha già questo nome
  //i ticket referenziano la categoria per nome (stringa): rinomino categoria e ticket insieme in transazione per mantenerli coerenti
  const [, aggiornata] = await db.$transaction([
    db.ticket.updateMany({ where: { categoria: c.nome }, data: { categoria: nome } }),
    db.categoria.update({ where: { id }, data: { nome } }),
  ]);
  return aggiornata;
}

export async function eliminaCategoria(id: number) {
  const c = await db.categoria.findUnique({ where: { id } });
  if (!c) throw new ApiError(404, "Categoria non trovata");
  //elimino solo se tutti i ticket della categoria sono risolti (o non ce ne sono ancora)
  if ((await db.ticket.count({ where: { categoria: c.nome, stato: { notIn: ["RISOLTO", "CHIUSO"] } } })) > 0) throw new ApiError(409, "Impossibile eliminare: la categoria ha ticket non ancora risolti");
  return db.categoria.delete({ where: { id } }); //per eliminare la categoria
}
