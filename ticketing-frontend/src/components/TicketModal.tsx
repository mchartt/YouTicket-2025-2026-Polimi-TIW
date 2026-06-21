import { useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import { AppCtx } from "../context/AppContext";
import { api } from "../services/api";
import type { TicketDetail } from "../types";
import { COLORE_STATO } from "../constants/ticketStatus";
import Allegati from "./Allegati";
import Conversazione from "./Conversazione";

export default function TicketModal({ id, iniziale, cats, onClose }: any) {
  const { user, notify } = useContext(AppCtx);

  const isNuovo = id === -1;

  const [ticket, setTicket] = useState<TicketDetail | null>(
    iniziale ? { ...iniziale, commenti: [], storicoStati: [], allegati: [] } : null
  );

  const [form, setForm] = useState({ titolo: "", desc: "", cat: cats[0]?.nome || "" });

  const [allegatiNuovi, setAllegatiNuovi] = useState<any[]>([]); //allegati scelti nella nuova richiesta, caricati dopo aver creato il ticket

  const [commento, setCommento] = useState("");

  const [stelle, setStelle] = useState(0);

  const [modifica, setModifica] = useState(false); //attiva la modalità di modifica del ticket (entro 15 minuti)
  const [editForm, setEditForm] = useState({ titolo: "", descrizione: "", categoria: "" });


  //carico i dettagli del ticket e poi resto in ascolto dei nuovi commenti via WebSocket (niente più polling)
  useEffect(() => {
    if (isNuovo) return; // se è un nuovo ticket non devo fare la richiesta al server
    api.dettagliTicket(id) //richiesta iniziale per prendere i dettagli del ticket
      .then(setTicket)
      .catch(() => { // se la richiesta fallisce mostro un messaggio di errore e chiudo il modal
        notify("Errore nel caricamento");
        onClose();
      });

    //apro la connessione Socket.IO e dico al server quale chat sto seguendo
    const socket = io(api.serverURL());
    socket.emit("seguiTicket", id);
    socket.on("nuovoCommento", (commento: any) => { //il server mi manda il nuovo commento
      setTicket(prev => {
        if (!prev || prev.commenti.some(c => c.id === commento.id)) return prev; //evito i doppioni
        return { ...prev, commenti: [...prev.commenti, commento] };
      });
    });
    return () => { socket.disconnect(); }; //chiudo la connessione quando esco dal ticket
  }, [id]);

  //ricarico i dati del ticket ad ogni operazione
  const ricarica = async () => {
    const ticketAggiornato = await api.dettagliTicket(id);
    setTicket(ticketAggiornato);
  };

  //funzione per creare un nuovo ticket, prende i dati dal form e li invia al server
  const creaTicket = async (e: any) => {
    e.preventDefault();
    try {
      const nuovo = await api.creaTicket({
        titolo: form.titolo,
        descrizione: form.desc,
        categoria: form.cat,
        autore: user.username
      });
      //ora che il ticket esiste e ha un id, carico gli allegati scelti nel form
      for (const allegato of allegatiNuovi) {
        await api.aggiungiAllegato(nuovo.id, allegato);
      }
      notify("Richiesta inviata!");
      onClose(); //chiudo il modal e torno alla lista dei ticket
    } catch (err: any) {
      notify(err.message);
    }
  };

  //funzione per aggiungere un commento al ticket, prende il testo dal campo commento e lo invia al server
  const aggiungiCommento = async () => {
    if (!commento.trim()) return; //se il commento è vuoto non faccio nulla
    try { //RICORDATI: inizialmente il commento parte vuoto poi viene aggiornato al click del bottone invia, se il commento è solo spazi vuol dire che è vuoto e non lo invio
      await api.aggiungiCommento(id, { testo: commento, autoreUsername: user.username }); //salvo nel backend
      setCommento(""); //pulisco il commento dopo l'invio: il commento comparirà via WebSocket
    } catch (err: any) {
      notify(err.message); //se c'è un errore mostro il messaggio di errore
    }
  };

  //funzione per cambiare lo stato del ticket, prende in input il nuovo stato e lo invia al server
  const cambiaStato = async (nuovoStato: string) => {
    try { //stessa cosa di prima
      await api.cambiaStato(id, { stato: nuovoStato, chiEsegueAzione: user.username });
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
      ricarica(); //ricarico i dati del ticket per aggiornare la priorità
    } catch (err: any) {
      notify(err.message);
    }
  };

  const prendiInCarico = async () => {
    try {
      await api.takeCharge(id, user.username);
      notify("Ticket preso in carico");
      ricarica(); //ricarico i dati del ticket per aggiornare lo stato e il tecnico assegnato
    } catch (err: any) {
      notify(err.message);
    }
  };

  const inviaValutazione = async () => {
    try {
      await api.inviaFeedback(id, stelle);
      notify("Feedback inviato!");
      ricarica();
    } catch (err: any) {
      notify(err.message);
    }
  };

  //apro il form di modifica precompilato con i dati attuali del ticket
  const apriModifica = () => {
    if (!ticket) return;
    setEditForm({ titolo: ticket.titolo, descrizione: ticket.descrizione, categoria: ticket.categoria });
    setModifica(true);
  };

  //salvo le modifiche al ticket (consentite solo entro 15 minuti, controllo anche lato server)
  const salvaModifica = async (e: any) => {
    e.preventDefault();
    try {
      await api.modificaTicket(id, { ...editForm, autore: user.username });
      notify("Ticket aggiornato");
      setModifica(false);
      ricarica();
    } catch (err: any) {
      notify(err.message);
    }
  };

  //archivio un ticket risolto: esce dalla lista attiva e finisce nella sezione archivio
  const archivia = async () => {
    try {
      await api.archiviaTicket(id);
      notify("Ticket archiviato");
      onClose();
    } catch (err: any) {
      notify(err.message);
    }
  };

  //leggo il file scelto, lo converto in data URL e lo aggiungo alla lista della nuova richiesta
  const caricaAllegato = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { notify("File troppo grande (max 5MB)"); return; }
    if (allegatiNuovi.length >= 3) { notify("Massimo 3 allegati"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setAllegatiNuovi(prev => [...prev, { nomeFile: file.name, tipo: file.type, dati: reader.result }]);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; //resetto l'input così posso ricaricare lo stesso file
  };

  //tolgo un allegato dalla lista prima di inviare la richiesta
  const eliminaAllegato = (allegato: any) => setAllegatiNuovi(prev => prev.filter(a => a !== allegato));

  const risolto = ticket?.stato === "RISOLTO";
  //SE SONO UN UTENTE, IL TICKET È RISOLTO, SONO L'AUTORE DEL TICKET E NON HO ANCORA LASCIATO UNA VALUTAZIONE ALLORA POSSO LASCIARLA, ALTRIMENTI NO
  const flagSePossoLasciareValutazione = user.ruolo === "UTENTE" && ticket?.autore === user.username && risolto && !ticket?.valutazione;

  const tecnicoAssegnato = user.ruolo === "TECNICO" && ticket?.tecnico === user.username;

  //SE SONO UN TECNICO, IL TICKET È IN ATTESA, NON C'È ANCORA UN TECNICO ASSEGNATO ALLORA POSSO PRENDERE IN CARICO IL TICKET, ALTRIMENTI NO
  const flagPuoPrendereInCarico = user.ruolo === "TECNICO" && ticket?.stato === "IN_ATTESA" && !ticket?.tecnico;

  //SE SONO L'AUTORE E NON SONO PASSATI PIÙ DI 15 MINUTI DALLA CREAZIONE ALLORA POSSO MODIFICARE IL TICKET
  const entroQuindiciMinuti = !!ticket && (Date.now() - new Date(ticket.dataCreazione).getTime()) < 15 * 60 * 1000;
  const flagPuoModificare = user.ruolo === "UTENTE" && ticket?.autore === user.username && entroQuindiciMinuti;

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: isNuovo ? 600 : 1000 }} onClick={e => e.stopPropagation()}>
        <div className={`modal-content shadow-lg ${isNuovo ? "" : "ticket-detail"}`}>

        <div className="modal-header bg-light">
          <h3 className="h5 m-0">{isNuovo ? "Nuova richiesta" : `#${ticket?.id} - ${ticket?.titolo}`}</h3>
          <button className="btn-close" onClick={onClose} aria-label="Chiudi" />
        </div>

        {isNuovo ? ( //se è un nuovo ticket mostro il form per creare un nuovo ticket
          <form onSubmit={creaTicket} className="modal-body">
            <input required maxLength={60} className="form-control mb-3" placeholder="Titolo della richiesta"
              value={form.titolo} onChange={e => setForm({ ...form, titolo: e.target.value })} />
            <select required className="form-select mb-3" value={form.cat}
              onChange={e => setForm({ ...form, cat: e.target.value })}>
              {cats.map((c: any) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
            <textarea required maxLength={200} rows={5} className="form-control mb-1" placeholder="Descrivi il problema"
              value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
            <div className="form-text text-end mb-1">{form.desc.length}/200</div>
            <Allegati allegati={allegatiNuovi} puoModificare={true} onCarica={caricaAllegato} onElimina={eliminaAllegato} />
            <button type="submit" className="btn btn-primary fw-bold"><i className="fa-solid fa-paper-plane me-2" />Invia richiesta</button>
          </form>

        ) : !ticket ? (
          <div className="modal-body">Caricamento...</div>
          //non rimango bloccato all'infinito se non carico i dati o ci sono problemi il modale si chiude dopo qualche secondo grazie alla notifica di errore
          //Vatti a vedere lo useEffect che hai scritto sopra
        ) : (
          <div className="modal-body p-0">
            {/* il dettaglio sta a sinistra e la conversazione a destra, con altezza fissa così il modal non cambia forma */}
            <div className="row g-0 h-100">

              {/* ----COLONNA SINISTRA: DETTAGLI DEL TICKET---- */}
              <div className="col-md-7 h-100 overflow-auto p-3 border-end">

                <div className="d-flex gap-2 mb-3 align-items-center flex-wrap">
                  <span className={`badge rounded-pill text-capitalize ${COLORE_STATO[ticket.stato]}`}>{ticket.stato.replace(/_/g, " ")}</span>
                  {ticket.priorita && <span className="badge rounded-pill text-capitalize bg-info-subtle text-info-emphasis">{ticket.priorita}</span>}
                  {/* ----ARCHIVIA: disponibile a utente e tecnico quando il ticket è risolto e non ancora archiviato---- */}
                  {risolto && !ticket.archiviato && (
                    <button className="btn btn-outline-secondary btn-sm ms-auto" onClick={archivia}><i className="fa-solid fa-box-archive me-2" />Archivia</button>
                  )}
                </div>

                {modifica ? ( //modalità modifica: l'autore corregge titolo, categoria e descrizione entro 15 minuti
                  <form onSubmit={salvaModifica} className="card bg-light mb-3">
                    <div className="card-body">
                      <h5 className="h6 mb-3"><i className="fa-solid fa-pen me-2" />Modifica richiesta</h5>
                      <label className="form-label small fw-bold mb-1">Titolo</label>
                      <input required maxLength={60} className="form-control mb-3"
                        value={editForm.titolo} onChange={e => setEditForm({ ...editForm, titolo: e.target.value })} />
                      <label className="form-label small fw-bold mb-1">Categoria</label>
                      <select required className="form-select mb-3" value={editForm.categoria}
                        onChange={e => setEditForm({ ...editForm, categoria: e.target.value })}>
                        {cats.map((c: any) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                      </select>
                      <label className="form-label small fw-bold mb-1">Descrizione</label>
                      <textarea required maxLength={200} rows={4} className="form-control mb-1"
                        value={editForm.descrizione} onChange={e => setEditForm({ ...editForm, descrizione: e.target.value })} />
                      <div className="form-text text-end mb-3">{editForm.descrizione.length}/200</div>
                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary btn-sm"><i className="fa-solid fa-floppy-disk me-2" />Salva</button>
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setModifica(false)}>Annulla</button>
                      </div>
                    </div>
                  </form>
                ) : (<>
                  {/* ----INFORMAZIONI SUL TICKET---- */}
                  <div className="card bg-light mb-3">
                    <div className="card-body py-2">
                      <p className="mb-1">
                        <b>Categoria:</b> {ticket.categoria} | <b>Autore:</b> {ticket.autore} | <b>Tecnico:</b> {ticket.tecnico || "Non assegnato"}
                      </p>
                      <p className="mb-0 small text-muted">
                        Aperto il {new Date(ticket.dataCreazione).toLocaleString("it-IT")}
                      </p>
                      {flagPuoModificare && (
                        <button className="btn btn-outline-primary btn-sm mt-2" onClick={apriModifica}><i className="fa-solid fa-pen me-2" />Modifica</button>
                      )}
                    </div>
                  </div>

                  {/* ----DESCRIZIONE DEL PROBLEMA---- */}
                  <div className="card bg-light mb-3">
                    <div className="card-body py-2">
                      <p className="mb-1"><b>Descrizione:</b></p>
                      <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{ticket.descrizione}</p>
                    </div>
                  </div>
                </>)}

                {/* ----ALLEGATI: in sola lettura, si scaricano e basta (si aggiungono solo creando la richiesta)---- */}
                <Allegati allegati={ticket.allegati} ticketId={id} puoModificare={false} />

                {/* ----SEZIONE PER IL TECNICO: PRENDI IN CARICO, CAMBIA STATO E PRIORITA'---- */}
                {(flagPuoPrendereInCarico || (tecnicoAssegnato && !risolto)) && (
                  <div className="card bg-light mb-3">
                    <div className="card-body">
                      {flagPuoPrendereInCarico && (
                        <button className="btn btn-primary fw-bold" onClick={prendiInCarico}><i className="fa-solid fa-hand me-2" />Prendi in carico</button>
                      )}
                      {tecnicoAssegnato && !risolto && (
                        <div className="row g-2">
                          <div className="col-md">
                            <select className="form-select" value={ticket.stato} onChange={e => cambiaStato(e.target.value)}>
                              <option value={ticket.stato} disabled>{ticket.stato.replace(/_/g, " ")} (attuale)</option>
                              {ticket.stato === "PRESO_IN_CARICO" && <option value="IN_LAVORAZIONE" disabled={!ticket.priorita}>In lavorazione{!ticket.priorita ? " (assegna priorità)" : ""}</option>}
                              {ticket.stato === "IN_LAVORAZIONE" && <option value="RISOLTO">Risolto</option>}
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

                {/* ----SEZIONE PER LA VALUTAZIONE---- */}
                <div className="card bg-light mb-3">
                  <div className="card-body d-flex align-items-center gap-2 flex-wrap">
                    <b>Valutazione:</b>
                    {ticket.valutazione ? (
                      <span>
                        {[1, 2, 3, 4, 5].map(n => (
                          <span key={n} style={{ fontSize: 22, color: n <= ticket.valutazione! ? "var(--bs-warning)" : "var(--bs-border-color)" }}>&#9733;</span>
                        ))}
                      </span>
                    ) : flagSePossoLasciareValutazione ? ( //solo se utente e stato risolto
                      <>
                        <span> {/* valutazione sottoforma di stelle */}
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} type="button"
                              className="border-0 bg-transparent p-0"
                              style={{ fontSize: 22, cursor: "pointer", color: n <= stelle ? "var(--bs-warning)" : "var(--bs-border-color)" }}
                              onClick={() => setStelle(n)}>
                              &#9733; {/* CARATTERE UNICO PER LA STELLA, SE N è minore o uguale a stelle coloro la stella altrimenti la lascio grigia */}
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

                {/* ----STORICO STATI---- */}
                {ticket.storicoStati.length > 0 && (<>
                  <h4 className="h6">Storico stati</h4>
                  <ul className="ps-4 small text-secondary mb-0">
                    {ticket.storicoStati.map(s => (
                      <li key={s.id}>
                        {new Date(s.cambiatoIl).toLocaleString("it-IT")} — {s.statoNuovo.replace(/_/g, " ")} ({s.cambiatoDa})
                      </li>
                    ))}
                  </ul>
                </>)}
              </div>

              {/* ----COLONNA DESTRA: CONVERSAZIONE---- */}
              <Conversazione commenti={ticket.commenti} mioUsername={user.username}
                puoScrivere={(user.ruolo === "UTENTE" || tecnicoAssegnato) && !risolto}
                commento={commento} setCommento={setCommento} onInvia={aggiungiCommento} />

            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
