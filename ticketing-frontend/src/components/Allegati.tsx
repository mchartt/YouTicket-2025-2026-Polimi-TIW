import { api } from "../services/api";

//Sezione allegati: massimo 3 file, mostrati in orizzontale con la x per rimuoverli
export default function Allegati({ allegati, ticketId, puoModificare, onCarica, onElimina }: any) {
  return (
    <div className="card bg-light mb-3">
      <div className="card-body py-2">
        <p className="mb-2"><b><i className="fa-solid fa-paperclip me-2" />Allegati ({allegati.length}/3)</b></p>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {allegati.length === 0 && <span className="small text-muted">Nessun allegato.</span>}
          {allegati.map((a: any) => (
            <span key={a.id} className="d-inline-flex align-items-center gap-2 border rounded-pill bg-white ps-3 pe-2 py-1">
              <a className="small text-decoration-none text-truncate" style={{ maxWidth: 140 }} href={api.attachmentUrl(ticketId, a.id)} target="_blank" rel="noreferrer" title={a.nomeFile}>
                <i className="fa-solid fa-download me-2" />{a.nomeFile}
              </a>
              {puoModificare && (
                <button type="button" className="btn btn-sm btn-link text-danger p-0 lh-1" aria-label="Rimuovi allegato" onClick={() => onElimina(a.id)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </span>
          ))}
          {puoModificare && allegati.length < 3 && (
            <label className="btn btn-outline-primary btn-sm mb-0">
              <i className="fa-solid fa-paperclip me-2" />Allega file
              <input type="file" hidden onChange={onCarica} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
