import { useState, useEffect, useContext, useRef } from "react";
import { AppCtx } from "../context/AppContext";
import { api } from "../services/api";
import type { TicketDetail } from "../types";
import { COLORE_STATO } from "../constants/ticketStatus";

export default function TicketModal({ id, iniziale, cats, onClose }: any) {
  const { user, notify } = useContext(AppCtx);

  const isNuovo = id === -1;

  const [ticket, setTicket] = useState<TicketDetail | null>(
    iniziale ? { ...iniziale, commenti: [], storicoStati: [] } : null
  );

  const [form, setForm] = useState({ titolo: "", desc: "", cat: cats[0]?.nome || "" });

  const [commento, setCommento] = useState("");

  const [stelle, setStelle] = useState(0);

  const chat = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNuovo) return;
    api.ticketDetails(id)
      .then(setTicket)
      .catch(() => {
        notify("Errore nel caricamento");
        onClose();
      });

    // ogni mezzo secondo controllo se e arrivato un commento nuovo e aggiorno solo la conversazione
    const intervallo = setInterval(async () => {
      try {
        const aggiornato = await api.ticketDetails(id);
        setTicket(prev =>
          prev && aggiornato.commenti.length !== prev.commenti.length
            ? { ...prev, commenti: aggiornato.commenti }
            : prev
        );
      } catch {
        // se la rete cade lascio com'e e riprovo al giro dopo
      }
    }, 500);
    return () => clearInterval(intervallo);
  }, [id]);

  // porto la conversazione in fondo quando arriva un commento
  useEffect(() => {
    if (chat.current) chat.current.scrollTop = chat.current.scrollHeight;
  }, [ticket?.commenti.length]);

  const ricarica = async () => {
    const aggiornato = await api.ticketDetails(id);
    setTicket(aggiornato);
  };

  const creaTicket = async (e: any) => {
    e.preventDefault();
    try {
      await api.createTicket({
        titolo: form.titolo,
        descrizione: form.desc,
        categoria: form.cat,
        autore: user.username
      });
      notify("Richiesta inviata!");
      onClose();
    } catch (err: any) {
      notify(err.message);
    }
  };

  const aggiungiCommento = async () => {
    if (!commento.trim()) return;
    try {
      await api.addComment(id, { testo: commento, autoreUsername: user.username });
      setCommento("");
      notify("Commento aggiunto");
      ricarica();
    } catch (err: any) {
      notify(err.message);
    }
  };

  const cambiaStato = async (nuovoStato: string) => {
    try {
      await api.changeStatus(id, { stato: nuovoStato, chiEsegueAzione: user.username });
      notify("Stato aggiornato");
      ricarica();
    } catch (err: any) {
      notify(err.message);
    }
  };

  const cambiaPriorita = async (priorita: string) => {
    try {
      await api.changePriority(id, priorita, user.username);
      notify("Priorità aggiornata");
      ricarica();
    } catch (err: any) {
      notify(err.message);
    }
  };

  const prendiInCarico = async () => {
    try {
      await api.takeCharge(id, user.username);
      notify("Ticket preso in carico");
      ricarica();
    } catch (err: any) {
      notify(err.message);
    }
  };

  const inviaValutazione = async () => {
    try {
      await api.sendFeedback(id, stelle);
      notify("Feedback inviato!");
      ricarica();
    } catch (err: any) {
      notify(err.message);
    }
  };

  const risolto = ticket?.stato === "RISOLTO";

  const possoLasciareValutazione = user.ruolo === "UTENTE" && ticket?.autore === user.username && risolto && !ticket?.valutazione;

  const tecnicoAssegnato = user.ruolo === "TECNICO" && ticket?.tecnico === user.username;

  const puoPrendereInCarico = user.ruolo === "TECNICO" && ticket?.stato === "IN_ATTESA" && !ticket?.tecnico;

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div className="modal-content shadow-lg">

        <div className="modal-header bg-light">
          <h3 className="h5 m-0">{isNuovo ? "Nuova richiesta" : `#${ticket?.id} - ${ticket?.titolo}`}</h3>
          <button className="btn-close" onClick={onClose} aria-label="Chiudi" />
        </div>

        {isNuovo ? (
          <form onSubmit={creaTicket} className="modal-body">
            <input required className="form-control mb-3" placeholder="Titolo della richiesta"
              value={form.titolo} onChange={e => setForm({ ...form, titolo: e.target.value })} />
            <select required className="form-select mb-3" value={form.cat}
              onChange={e => setForm({ ...form, cat: e.target.value })}>
              {cats.map((c: any) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
            <textarea required rows={5} className="form-control mb-3" placeholder="Descrivi il problema"
              value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
            <button type="submit" className="btn btn-primary fw-bold">Invia richiesta</button>
          </form>

        ) : !ticket ? (
          <div className="modal-body">Caricamento...</div>

        ) : (
          <div className="modal-body">

            <div className="d-flex gap-2 mb-3">
              <span className={`badge rounded-pill text-capitalize ${COLORE_STATO[ticket.stato]}`}>{ticket.stato.replace(/_/g, " ")}</span>
              {ticket.priorita && <span className="badge rounded-pill text-capitalize bg-info-subtle text-info-emphasis">{ticket.priorita}</span>}
            </div>

            <div className="card bg-light mb-3">
              <div className="card-body py-2">
                <p className="mb-1">
                  <b>Categoria:</b> {ticket.categoria} | <b>Autore:</b> {ticket.autore} | <b>Tecnico:</b> {ticket.tecnico || "Non assegnato"}
                </p>
                <p className="mb-0 small text-muted">
                  Aperto il {new Date(ticket.dataCreazione).toLocaleString("it-IT")}
                </p>
              </div>
            </div>

            <p className="mb-3" style={{ whiteSpace: "pre-wrap" }}>{ticket.descrizione}</p>

            {(puoPrendereInCarico || (tecnicoAssegnato && !risolto)) && (
              <div className="card bg-light mb-3">
                <div className="card-body">
                  {puoPrendereInCarico && (
                    <button className="btn btn-primary fw-bold" onClick={prendiInCarico}>Prendi in carico</button>
                  )}
                  {tecnicoAssegnato && !risolto && (
                    <div className="row g-2">
                      <div className="col-md">
                        <select className="form-select" value={ticket.stato} onChange={e => cambiaStato(e.target.value)}>
                          <option value={ticket.stato} disabled>{ticket.stato.replace(/_/g, " ")} (attuale)</option>
                          {ticket.stato === "PRESO_IN_CARICO" && <option value="IN_LAVORAZIONE">In lavorazione</option>}
                          {(ticket.stato === "PRESO_IN_CARICO" || ticket.stato === "IN_LAVORAZIONE") && <option value="RISOLTO">Risolto</option>}
                        </select>
                      </div>
                      <div className="col-md">
                        <select className="form-select" value={ticket.priorita || ""} onChange={e => cambiaPriorita(e.target.value)}>
                          <option value="" disabled>Assegna priorità</option>
                          <option value="BASSA">Bassa</option>
                          <option value="MEDIA">Media</option>
                          <option value="ALTA">Alta</option>
                          <option value="URGENTE">Urgente</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="card bg-light mb-3">
              <div className="card-body d-flex align-items-center gap-2 flex-wrap">
                <b>Valutazione:</b>
                {ticket.valutazione ? (
                  <span>
                    {[1, 2, 3, 4, 5].map(n => (
                      <span key={n} style={{ fontSize: 22, color: n <= ticket.valutazione! ? "var(--bs-warning)" : "var(--bs-border-color)" }}>&#9733;</span>
                    ))}
                  </span>
                ) : possoLasciareValutazione ? (
                  <>
                    <span>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} type="button"
                          className="border-0 bg-transparent p-0"
                          style={{ fontSize: 22, cursor: "pointer", color: n <= stelle ? "var(--bs-warning)" : "var(--bs-border-color)" }}
                          onClick={() => setStelle(n)}>
                          &#9733;
                        </button>
                      ))}
                    </span>
                    <button className="btn btn-primary btn-sm" disabled={!stelle} onClick={inviaValutazione}>Invia</button>
                  </>
                ) : (
                  <span className="text-muted">Non ancora disponibile</span>
                )}
              </div>
            </div>

            <h4 className="h6">Conversazione ({ticket.commenti.length})</h4>
            <div ref={chat} className="overflow-auto mb-2" style={{ maxHeight: 300 }}>
              {ticket.commenti.map(c => {
                const mio = c.autoreUsername === user.username;
                return (
                  <div key={c.id} className={`d-flex mb-2 ${mio ? "justify-content-start" : "justify-content-end"}`}>
                    <div className={`card ${mio ? "bg-info-subtle" : "bg-light"}`} style={{ maxWidth: "75%" }}>
                      <div className="card-body py-2">
                        <b>{c.autoreUsername}</b>{" "}
                        <small className="text-muted">{new Date(c.creatoIl).toLocaleString("it-IT")}</small>
                        <p className="mb-0 mt-1 text-break">{c.testo}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {(user.ruolo === "UTENTE" || tecnicoAssegnato) && !risolto && (
              <div className="input-group my-3">
                <input className="form-control" placeholder="Scrivi un messaggio..."
                  value={commento} onChange={e => setCommento(e.target.value)} />
                <button className="btn btn-primary" onClick={aggiungiCommento}>Invia</button>
              </div>
            )}

            {ticket.storicoStati.length > 0 && (<>
              <h4 className="h6">Storico stati</h4>
              <ul className="ps-4 small text-secondary">
                {ticket.storicoStati.map(s => (
                  <li key={s.id}>
                    {new Date(s.cambiatoIl).toLocaleString("it-IT")} — {s.statoNuovo.replace(/_/g, " ")} ({s.cambiatoDa})
                  </li>
                ))}
              </ul>
            </>)}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
