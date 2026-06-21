import { useState, useEffect, useContext } from "react";
import { AppCtx } from "../context/AppContext";
import { api } from "../services/api";
import type { Ticket } from "../types";
import { COLORE_STATO } from "../constants/ticketStatus";
import TicketModal from "./TicketModal";

export default function Dashboard() {
  const { user, notify } = useContext(AppCtx); //prendo i dati dell'utente loggato e la funzione di notifica dal contesto globale AppCtx

  //React non ha ArrayList come Java
  //--------------------------------
  // Aggiungere un elemento (come .add())
  //setTickets(prev => [...prev, newTicket]); - prendo la copia ed aggiungo un ticket

  // Rimuovere per indice (come .remove(index))
  //setTickets(prev => prev.filter((_, i) => i !== index)); - usi underscore che non ti interessa il primo argomento

  // Rimuovere per valore/id (come .remove(obj))
  //setTickets(prev => prev.filter(t => t.id !== ticketId));

  // Aggiornare un elemento (come .set(index, obj))
  //setTickets(prev => prev.map(t => t.id === id ? updatedTicket : t));


  const [tickets, setTickets] = useState<Ticket[]>([]); 
  const [categorie, setCategorie] = useState<any[]>([]);

  const [filtroStato, setFiltroStato] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroPriorita, setFiltroPriorita] = useState("");
  const [filtroTecnico, setFiltroTecnico] = useState("");
  const [ricerca, setRicerca] = useState(""); //testo della ricerca libera su titolo e descrizione

  const [vista, setVista] = useState<"attivi" | "archivio">("attivi"); //sezione corrente: ticket attivi o archivio

  const [ticketAperto, setTicketAperto] = useState<number | null>(null);

  const [autoAssign, setAutoAssign] = useState<boolean>(user.autoAssegnazione ?? false);

  const [mieStatistiche, setStatsMie] = useState<any>(null); //statistiche valutazioni dei miei ticket (tecnico)
  const [statisticheTeam, setStatsTeam] = useState<any>(null); //statistiche valutazioni di tutto il team (tecnico)

  const toggleAutoAssign = async (checked: boolean) => {
    await api.toggleAutoAssegnazione(user.username, checked);
    setAutoAssign(checked);
    notify(checked ? "Auto-assegnazione attivata" : "Auto-assegnazione disattivata");
  };

   /* Serve a costruire la query string per filtrare i ticket in base ai filtri selezionati.
    URLSearchParams è una classe built-in di JavaScript che permette di creare e manipolare query string in modo semplice e sicuro, 
    evitando problemi di encoding o concatenazione manuale. 
    Esempio:
    const params = new URLSearchParams();
    params.append("stato", "aperto");
    params.toString(); // → "stato=aperto"
   */
  const caricaDati = async () => {
    try {
      const params = new URLSearchParams(); //creo un nuovo oggetto URLSearchParams per costruire la query string
      if (filtroStato) params.append("stato", filtroStato); //"Esempio .../stato="IN_ATTESA"
      if (filtroCategoria) params.append("categoria", filtroCategoria); //"Esempio .../categoria="Hardware"
      if (filtroPriorita) params.append("priorita", filtroPriorita); //"Esempio .../priorita="ALTA"
      if (filtroTecnico) params.append("tecnico", filtroTecnico);  //"Esempio .../tecnico="mario.rossi"
      if (ricerca) params.append("q", ricerca); //ricerca testuale su titolo e descrizione
      params.append("archiviato", vista === "archivio" ? "true" : "false"); //archivio o ticket attivi
      if (user.ruolo === "UTENTE") params.append("autore", user.username); //se l'utente è un utente normale, filtro per l'autore in modo che veda solo i suoi ticket

      const [listaTickets, listaCat] = await Promise.all([
        api.tickets(params.toString()), //richiesta 1 faccio una fetch per prendere i ticket filtrati
        categorie.length === 0 ? api.categorie() : Promise.resolve(categorie) //richiesta 2 prendo le categorie solo se non le ho già caricate, altrimenti risolvo subito con quelle già in stato
      ]);

      setTickets(listaTickets); //aggiorno lo stato dei ticket con quelli presi dalla richiesta
      if (categorie.length === 0) setCategorie(listaCat);  //se non avevo già le categorie, aggiorno lo stato con quelle prese dalla richiesta

      if (user.ruolo === "TECNICO") { //il tecnico vede la media delle valutazioni dei suoi ticket e di quelli del team
        api.stats(user.username).then(setStatsMie).catch(() => {});
        api.stats().then(setStatsTeam).catch(() => {});
      }
    } catch {
      notify("Errore nel caricamento dei dati");
    }
  };

  
  //estraggo la lista dei tecnici dai ticket per popolare il filtro tecnico,
  // uso Set per avere solo valori unici e filtro i ticket che hanno tecnico assegnato
  const tecnici = [...new Set(tickets.map(t => t.tecnico).filter(Boolean))] as string[];

  useEffect(() => { caricaDati(); }, [filtroStato, filtroCategoria, filtroPriorita, filtroTecnico, ricerca, vista]);

  //--Definisco il colore del bordo del ticket a seconda dello stato--
  const colore = (t: Ticket) => {
    if (t.stato === "RISOLTO") return "#16a34a";
    if (t.stato === "IN_LAVORAZIONE") return "#919191";
    if (t.stato === "PRESO_IN_CARICO") return "#eab308";
    if (t.stato === "IN_ATTESA") return "#dc2626";
    return "#cbd5e1";
  };

  //--Statistiche per i badge in alto--
  const aperti   = tickets.filter(t => t.stato !== "RISOLTO").length; 
  const inAttesa = tickets.filter(t => t.stato === "IN_ATTESA").length;
  const inLav    = tickets.filter(t => t.stato === "PRESO_IN_CARICO" || t.stato === "IN_LAVORAZIONE").length;
  const risolti  = tickets.filter(t => t.stato === "RISOLTO").length;

  return (
    <div>
      <div className="card mb-4 shadow-sm">
        <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2"> 
          {/* card = mostra un box con bordo bianco, shadow-sm = aggiunge un'ombra leggera, mb-4 = margin bottom,
          card-body = aggiunge padding interno standard del contenuto della card
          d-flex = rende il div un flex container — i suoi figli si dispongono in riga (o colonna) invece che impilati a blocchi
          justify-content-between: I figli vengono spinti agli estremi opposti: uno a sinistra, uno a destra, con spazio vuoto in mezzo
          align-items-center: I figli sono centrati verticalmente tra loro
          flex-wrap gap-2 = se lo spazio è troppo piccolo, va a capo e aggiunge uno spazio tra gli elementi */}
          <div>
            <h2 className="mb-1">Ciao, {user.nome || user.username}!</h2>
            <p className="text-muted mb-0">{aperti} richieste ancora aperte.</p>
          </div>
          {user.ruolo === "UTENTE" && (
            <button className="btn btn-primary fw-bold" onClick={() => setTicketAperto(-1)}><i className="fa-solid fa-plus me-2" />Nuova richiesta</button>
            //uso -1 come id fittizio per indicare che voglio aprire il modal per creare un nuovo ticket,
            //invece di visualizzare i dettagli di uno esistente
            //considera che inizialmente hai messo ticketAperto a null QUINDI:
            //se ticketAperto è null → non mostro il modal
            //se ticketAperto è -1 → mostro il modal con campi vuoti per creare un nuovo ticket
            //se ticketAperto è un id valido → mostro il modal con i dettagli del ticket corrispondente
          )}
        </div>
      </div>

      {/* ---SEZIONI: TICKET ATTIVI / ARCHIVIO---*/}
      <div className="btn-group mb-4">
        <button className={`btn ${vista === "attivi" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setVista("attivi")}><i className="fa-solid fa-inbox me-2" />Attivi</button>
        <button className={`btn ${vista === "archivio" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setVista("archivio")}><i className="fa-solid fa-box-archive me-2" />Archivio</button>
      </div>

      {/* ---MOSTRO STATISTICHE IN ALTO SOLO PER I TECNICI---*/}
      {user.ruolo === "TECNICO" && (
        <div className="row g-3 mb-4">
          <div className="col-sm-4"><div className="card text-center p-3 h-100 border-danger" style={{ borderTopWidth: 4 }}><b className="d-block fs-3">{inAttesa}</b>In attesa</div></div>
          <div className="col-sm-4"><div className="card text-center p-3 h-100 border-warning" style={{ borderTopWidth: 4 }}><b className="d-block fs-3">{inLav}</b>In lavorazione</div></div>
          <div className="col-sm-4"><div className="card text-center p-3 h-100 border-success" style={{ borderTopWidth: 4 }}><b className="d-block fs-3">{risolti}</b>Risolti</div></div>
        </div>
      )}

      {/* ---STATISTICHE VALUTAZIONI SOLO PER I TECNICI---*/}
      {user.ruolo === "TECNICO" && (
        <div className="row g-3 mb-4">
          <div className="col-sm-6">
            <div className="card p-3 h-100">
              <span className="text-muted small"><i className="fa-solid fa-user me-2" />Le mie valutazioni</span>
              <b className="fs-4"><i className="fa-solid fa-star text-warning me-2" />{mieStatistiche?.media ? mieStatistiche.media.toFixed(1) : "—"}</b>
              <span className="small text-muted">{mieStatistiche?.count || 0} valutazioni ricevute</span>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="card p-3 h-100">
              <span className="text-muted small"><i className="fa-solid fa-users me-2" />Valutazioni del team</span>
              <b className="fs-4"><i className="fa-solid fa-star text-warning me-2" />{statisticheTeam?.media ? statisticheTeam.media.toFixed(1) : "—"}</b>
              <span className="small text-muted">{statisticheTeam?.count || 0} valutazioni ricevute</span>
            </div>
          </div>
        </div>
      )}

      {/* ---FILTRI---*/}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {/* RICERCA TESTUALE SU TITOLO E DESCRIZIONE */}
        <div className="input-group" style={{ maxWidth: 260 }}>
          <span className="input-group-text bg-white"><i className="fa-solid fa-magnifying-glass" /></span>
          <input className="form-control" placeholder="Cerca..." value={ricerca} onChange={e => setRicerca(e.target.value)} />
        </div>

        {/* SELECT PER FILTRARE IN BASE ALLO STATO */}
        <select className="form-select" style={{ maxWidth: 200 }} value={filtroStato} onChange={e => setFiltroStato(e.target.value)}> 
          {/* e.target riferisce al select,
          e.target.value riferisce al suo valore e lo imposto come filtroStato */}
          <option value="">Tutti gli stati</option>
          <option value="IN_ATTESA">In attesa</option>
          <option value="PRESO_IN_CARICO">Preso in carico</option>
          <option value="IN_LAVORAZIONE">In lavorazione</option>
          <option value="RISOLTO">Risolto</option>
        </select>

        {/* SELECT PER FILTRARE IN BASE ALLA CATEGORIA */}
        <select className="form-select" style={{ maxWidth: 200 }} value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          <option value="">Tutte le categorie</option>
          {categorie.map((c: any) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
        </select>

        {/* SELECT PER FILTRARE IN BASE ALLA PRIORITA' */}
        <select className="form-select" style={{ maxWidth: 200 }} value={filtroPriorita} onChange={e => setFiltroPriorita(e.target.value)}>
          <option value="">Tutte le priorità</option>
          <option value="BASSA">Bassa</option>
          <option value="MEDIA">Media</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </select>

    
        {/* SELECT PER CHI FILTRARE IN BASE AL TECNICO*/}
        {user.ruolo === "TECNICO" && (
          <select className="form-select" style={{ maxWidth: 200 }} value={filtroTecnico} onChange={e => setFiltroTecnico(e.target.value)}>
            <option value="">Tutti gli operatori</option>
            {tecnici.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}

        {/*SELECT PER AUTO ASSEGNAZIONE*/}
        {user.ruolo === "TECNICO" && (
          <div className="form-check form-switch d-flex align-items-center ms-auto">
            <input className="form-check-input" type="checkbox" id="autoAssign" checked={autoAssign} onChange={e => toggleAutoAssign(e.target.checked)} />
            <label className="form-check-label ms-2" htmlFor="autoAssign">Auto-assegnazione</label>
          </div>
        )}
      </div>

      {/* ---TICKET CARD---*/}
      <div className="row g-3">
        {tickets.map(t => ( //mostro i ticket filtrati, al click su un ticket apro il modal con i dettagli del ticket cliccato
          <div key={t.id} className="col-md-6 col-lg-4">
            <div className="card h-100" onClick={() => setTicketAperto(t.id)} style={{ cursor: "pointer", borderLeftWidth: 4, borderLeftColor: colore(t) }}>
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <span className={`badge rounded-pill text-capitalize ${COLORE_STATO[t.stato]}`}>{t.stato.replace(/_/g, " ")}</span>
                  <span className="badge rounded-pill text-capitalize bg-light text-secondary">{t.priorita || "Da valutare"}</span>
                </div>
                <h3 className="h6 mt-3 mb-1">{t.titolo}</h3>
                <p className="small text-muted mb-0">{t.categoria} · {t.autore}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---MESSAGGIO SE NON CI SONO TICKET---*/}
      {tickets.length === 0 && (
        <p className="text-center text-muted mt-5">Nessun ticket trovato.</p>
      )}

      {/* ---MODAL PER VISUALIZZARE I DETTAGLI DEL TICKET---*/}
      {ticketAperto !== null && (
        <TicketModal
          id={ticketAperto}
          iniziale={tickets.find(t => t.id === ticketAperto)}
          cats={categorie}
          onClose={() => { setTicketAperto(null); caricaDati(); }} //alla chiusura reimposto ticketAperto a null 
          // e ricarico i dati per aggiornare metti che ho fatto modifiche al ticket
        />
      )}
    </div>
  );
}
