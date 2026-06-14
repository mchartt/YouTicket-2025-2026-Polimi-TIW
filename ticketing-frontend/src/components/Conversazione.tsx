import { useEffect, useRef } from "react";

//Colonna della conversazione: lista dei messaggi e box per inviarne di nuovi
export default function Conversazione({ commenti, mioUsername, puoScrivere, commento, setCommento, onInvia }: any) {
  const chat = useRef<HTMLDivElement>(null);

  // porto la conversazione in fondo quando arriva un commento
  useEffect(() => {
    if (chat.current) chat.current.scrollTop = chat.current.scrollHeight;
  }, [commenti.length]);

  return (
    <div className="col-md-5 h-100 d-flex flex-column">
      <div className="px-3 pt-3 pb-2 border-bottom">
        <h4 className="h6 m-0">Conversazione ({commenti.length})</h4>
      </div>
      <div ref={chat} className="flex-grow-1 overflow-auto p-3">
        {commenti.map((c: any) => { //per ogni commento controllo se è mio o dell'altro
        // per allinearlo a destra o sinistra e dargli un colore diverso
          const mio = c.autoreUsername === mioUsername;
          return (
            <div key={c.id} className={`d-flex mb-2 ${mio ? "justify-content-start" : "justify-content-end"}`}>
              <div className={`card ${mio ? "bg-info-subtle" : "bg-light"}`} style={{ maxWidth: "85%" }}>
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

      {/* se posso scrivere mostro il box per inviare un messaggio (Invio o Ctrl+Invio) */}
      {puoScrivere && (
        <div className="p-3 border-top">
          <div className="input-group">
            <input className="form-control" placeholder="Scrivi un messaggio... (Ctrl+Invio)"
              value={commento} onChange={e => setCommento(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") onInvia(); }} />
            <button className="btn btn-primary" onClick={onInvia}><i className="fa-solid fa-paper-plane" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
