import * as categorieService from "../services/categorie.service"; //introduco i service per utilizzare i metodi e logica di business

export const getCategorie = async (req: any, res: any) => res.json(await categorieService.getCategorie(req.query.attive === "true")); //per ottenere le categorie
export const creaCategoria = async (req: any, res: any) => res.status(201).json(await categorieService.creaCategoria(req.body.nome)); //per creare una nuova categoria
//                                                                                +req.params.id per convertire in numero (equivale a parseInt(req.params.id))
export const toggleCategoria = async (req: any, res: any) => res.json(await categorieService.toggleCategoria(+req.params.id, req.body.attivo)); //per attivare o disattivare una categoria
export const eliminaCategoria = async (req: any, res: any) => { await categorieService.eliminaCategoria(+req.params.id); res.sendStatus(204); }; //per eliminare una categoria
