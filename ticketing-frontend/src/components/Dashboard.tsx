import { useState, useEffect, useContext } from "react";
import { AppCtx } from "../context/AppContext";
import { api } from "../services/api";
import type { Ticket } from "../types";
import { COLORE_STATO } from "../constants/ticketStatus";
import TicketModal from "./TicketModal";

export default function Dashboard() {
  const { user, notify } = useContext(AppCtx);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categorie, setCategorie] = useState<any[]>([]);

  const [filtroStato, setFiltroStato] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroPriorita, setFiltroPriorita] = useState("");
  const [filtroTecnico, setFiltroTecnico] = useState("");

  const [ticketAperto, setTicketAperto] = useState<number | null>(null);

  const [autoAssign, setAutoAssign] = useState<boolean>(user.autoAssegnazione ?? false);

  const toggleAutoAssign = async (checked: boolean) => {
    await api.toggleAutoAssegnazione(user.username, checked);
    setAutoAssign(checked);
    notify(checked ? "Auto-assegnazione attivata" : "Auto-assegnazione disattivata");
  };

  const caricaDati = async () => {
    try {
      const params = new URLSearchParams();
      if (filtroStato) params.append("stato", filtroStato);
      if (filtroCategoria) params.append("categoria", filtroCategoria);
      if (filtroPriorita) params.append("priorita", filtroPriorita);
      if (filtroTecnico) params.append("tecnico", filtroTecnico);
      if (user.ruolo === "UTENTE") params.append("autore", user.username);

      const [listaTickets, listaCat] = await Promise.all([
        api.tickets(params.toString()),
        categorie.length === 0 ? api.cats() : Promise.resolve(categorie)
      ]);

      setTickets(listaTickets);
      if (categorie.length === 0) setCategorie(listaCat);
    } catch {
      notify("Errore nel caricamento dei dati");
    }
  };

  const tecnici = [...new Set(tickets.map(t => t.tecnico).filter(Boolean))] as string[];

  useEffect(() => { caricaDati(); }, [filtroStato, filtroCategoria, filtroPriorita, filtroTecnico]);

  const colore = (t: Ticket) => {
    if (t.stato === "RISOLTO") return "#16a34a";
    if (t.stato === "IN_LAVORAZIONE" || t.stato === "PRESO_IN_CARICO") return "#ea580c";
    if (t.stato === "IN_ATTESA") return "#dc2626";
    return "#cbd5e1";
  };

  const aperti   = tickets.filter(t => t.stato !== "RISOLTO").length;
  const inAttesa = tickets.filter(t => t.stato === "IN_ATTESA").length;
  const inLav    = tickets.filter(t => t.stato === "PRESO_IN_CARICO" || t.stato === "IN_LAVORAZIONE").length;
  const risolti  = tickets.filter(t => t.stato === "RISOLTO").length;

  return (
    <div>
      <div className="card mb-4 shadow-sm">
        <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 className="mb-1">Ciao, {user.nome || user.username}!</h2>
            <p className="text-muted mb-0">{aperti} richieste ancora aperte.</p>
          </div>
          {user.ruolo === "UTENTE" && (
            <button className="btn btn-primary fw-bold" onClick={() => setTicketAperto(-1)}>+ Nuova richiesta</button>
          )}
        </div>
      </div>

      {user.ruolo === "TECNICO" && (
        <div className="row g-3 mb-4">
          <div className="col-sm-4"><div className="card text-center p-3 h-100 border-danger" style={{ borderTopWidth: 4 }}><b className="d-block fs-3">{inAttesa}</b>In attesa</div></div>
          <div className="col-sm-4"><div className="card text-center p-3 h-100 border-warning" style={{ borderTopWidth: 4 }}><b className="d-block fs-3">{inLav}</b>In lavorazione</div></div>
          <div className="col-sm-4"><div className="card text-center p-3 h-100 border-success" style={{ borderTopWidth: 4 }}><b className="d-block fs-3">{risolti}</b>Risolti</div></div>
        </div>
      )}

      <div className="d-flex flex-wrap gap-2 mb-4">
        <select className="form-select" style={{ maxWidth: 200 }} value={filtroStato} onChange={e => setFiltroStato(e.target.value)}>
          <option value="">Tutti gli stati</option>
          <option value="IN_ATTESA">In attesa</option>
          <option value="PRESO_IN_CARICO">Preso in carico</option>
          <option value="IN_LAVORAZIONE">In lavorazione</option>
          <option value="RISOLTO">Risolto</option>
        </select>

        <select className="form-select" style={{ maxWidth: 200 }} value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          <option value="">Tutte le categorie</option>
          {categorie.map((c: any) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
        </select>

        <select className="form-select" style={{ maxWidth: 200 }} value={filtroPriorita} onChange={e => setFiltroPriorita(e.target.value)}>
          <option value="">Tutte le priorità</option>
          <option value="BASSA">Bassa</option>
          <option value="MEDIA">Media</option>
          <option value="ALTA">Alta</option>
          <option value="URGENTE">Urgente</option>
        </select>

        {user.ruolo === "TECNICO" && (
          <select className="form-select" style={{ maxWidth: 200 }} value={filtroTecnico} onChange={e => setFiltroTecnico(e.target.value)}>
            <option value="">Tutti gli operatori</option>
            {tecnici.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}

        {user.ruolo === "TECNICO" && (
          <div className="form-check form-switch d-flex align-items-center">
            <input className="form-check-input" type="checkbox" id="autoAssign" checked={autoAssign} onChange={e => toggleAutoAssign(e.target.checked)} />
            <label className="form-check-label ms-2" htmlFor="autoAssign">Auto-assegnazione ticket</label>
          </div>
        )}
      </div>

      <div className="row g-3">
        {tickets.map(t => (
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

      {tickets.length === 0 && (
        <p className="text-center text-muted mt-5">Nessun ticket trovato.</p>
      )}

      {ticketAperto !== null && (
        <TicketModal
          id={ticketAperto}
          iniziale={tickets.find(t => t.id === ticketAperto)}
          cats={categorie}
          onClose={() => { setTicketAperto(null); caricaDati(); }}
        />
      )}
    </div>
  );
}
