import { useState, useEffect, useContext } from "react";
import { AppCtx } from "../context/AppContext";
import { api } from "../services/api";

//MODAL DI GESTIONE CATEGORIE (solo per i tecnici): creare, rinominare ed eliminare le categorie.
//onClose riceve un booleano: true se sono state fatte modifiche, così il Dashboard può ricaricare le categorie.
export default function GestioneCategorie({ onClose }: { onClose: (modificato: boolean) => void }) {
  const { notify } = useContext(AppCtx);

  const [categorie, setCategorie] = useState<any[]>([]);
  const [nuovoNome, setNuovoNome] = useState(""); //input per creare una nuova categoria

  const [editId, setEditId] = useState<number | null>(null); //id della categoria in modifica
  const [editNome, setEditNome] = useState(""); //nuovo nome durante la modifica

  const [modificato, setModificato] = useState(false); //tengo traccia se ho fatto modifiche per avvisare il Dashboard alla chiusura

  //carico le categorie all'apertura del modal
  const carica = () => api.categorie().then(setCategorie).catch(() => notify("Errore nel caricamento delle categorie"));
  useEffect(() => { carica(); }, []);

  //---CREAZIONE NUOVA CATEGORIA---
  const crea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovoNome.trim()) return;
    try {
      await api.creaCategoria(nuovoNome.trim());
      setNuovoNome("");
      setModificato(true);
      notify("Categoria creata");
      carica();
    } catch (err: any) {
      notify(err.message || "Errore nella creazione");
    }
  };

  //---SALVATAGGIO RINOMINA---
  const salvaCategoria = async (id: number) => {
    if (!editNome.trim()) return;
    try {
      await api.modificaCategoria(id, editNome.trim());
      setEditId(null);
      setModificato(true);
      notify("Categoria rinominata");
      carica();
    } catch (err: any) {
      notify(err.message || "Errore nella modifica");
    }
  };

  //---ELIMINAZIONE---
  //il backend consente l'eliminazione solo se tutti i ticket della categoria sono risolti (o non ce ne sono)
  const elimina = async (id: number, nome: string) => {
    if (!confirm(`Eliminare la categoria "${nome}"? L'operazione è possibile solo se tutti i suoi ticket sono risolti.`)) return;
    try {
      await api.eliminaCategoria(id);
      setModificato(true);
      notify("Categoria eliminata");
      carica();
    } catch (err: any) {
      notify(err.message || "Impossibile eliminare la categoria");
    }
  };

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => onClose(modificato)}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-content shadow-lg">
          <div className="modal-header bg-light">
            <h5 className="modal-title"><i className="fa-solid fa-tags text-primary me-2" />Gestione categorie</h5>
            <button type="button" className="btn-close" onClick={() => onClose(modificato)} />
          </div>

          <div className="modal-body">
            {/* ---FORM CREAZIONE NUOVA CATEGORIA--- */}
            <form onSubmit={crea} className="input-group mb-4">
              <input className="form-control" placeholder="Nome nuova categoria" value={nuovoNome} onChange={e => setNuovoNome(e.target.value)} />
              <button type="submit" className="btn btn-primary fw-bold"><i className="fa-solid fa-plus me-2" />Crea</button>
            </form>

            {/* ---LISTA CATEGORIE ESISTENTI--- */}
            <ul className="list-group">
              {categorie.map(c => (
                <li key={c.id} className="list-group-item d-flex justify-content-between align-items-center gap-2">
                  {editId === c.id ? (
                    //---MODALITA' MODIFICA NOME---
                    <>
                      <input className="form-control form-control-sm" value={editNome} onChange={e => setEditNome(e.target.value)} autoFocus
                        onKeyDown={e => { if (e.key === "Enter") salvaCategoria(c.id); if (e.key === "Escape") setEditId(null); }} />
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-success" onClick={() => salvaCategoria(c.id)}><i className="fa-solid fa-check" /></button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditId(null)}><i className="fa-solid fa-xmark" /></button>
                      </div>
                    </>
                  ) : (
                    //---VISUALIZZAZIONE NORMALE---
                    <>
                      <span>{c.nome}</span>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-primary" title="Rinomina" onClick={() => { setEditId(c.id); setEditNome(c.nome); }}><i className="fa-solid fa-pen" /></button>
                        <button className="btn btn-sm btn-outline-danger" title="Elimina" onClick={() => elimina(c.id, c.nome)}><i className="fa-solid fa-trash" /></button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {categorie.length === 0 && <p className="text-center text-muted my-3">Nessuna categoria.</p>}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => onClose(modificato)}>Chiudi</button>
          </div>
        </div>
      </div>
    </div>
  );
}
