import { useState, useContext } from "react";
import { AppCtx } from "../context/AppContext";
import { api } from "../services/api";

export default function Auth() {
  const { login, notify } = useContext(AppCtx); //prendo le funzioni di login e notify dal contesto globale AppCtx

  const [isLogin, setIsLogin] = useState(true); //stato per sapere se siamo in modalità login o registrazione

  const [form, setForm] = useState({ 
    username: "", password: "", nome: "", cognome: "", email: "", ruolo: "UTENTE"
  }); //stato per tenere traccia dei valori del form di login/registrazione

  const [errore, setErrore] = useState(""); //stato per tenere traccia del messaggio di errore da mostrare all'utente

  const [mostraPassword, setMostraPassword] = useState(false); //true = password in chiaro, false = pallini

  //funzione per aggiornare i campi del form, 
  // prende in input il nome del campo e il suo valore e aggiorna lo stato form di conseguenza
  const set = (campo: string, valore: string) => setForm({ ...form, [campo]: valore }); 
  //[campo]: valore è una sintassi per aggionare il campo specifico al click/inserimento

  //definisco funzione submit così al click di invio viene chiamata 
  const submit = async (e: any) => {
    e.preventDefault(); //previene comportamenti di default eventi
    //nel caso del submit di un form, previene il refresh della pagina all'invio
    setErrore(""); //resetto il messaggio di errore prima di fare la richiesta, 
    // così se c'è un nuovo errore mostro solo quello più recente

    try {
      const dati = isLogin // a seconda se siamo in modalità login o registrazione 
      // chiamo l'API corrispondente con i dati del form
        ? await api.login({ username: form.username, password: form.password })
        : await api.register({ 
            nome: form.nome,
            cognome: form.cognome,
            email: form.email,
            password: form.password,
            ruolo: form.ruolo
          });

      login(dati); // se la richiesta ha successo, chiamo la funzione di login del contesto globale
      notify(isLogin ? "Accesso effettuato" : "Registrazione completata"); //mostro una notifica di successo a seconda se era login o registrazione
      //RICORDATI che sia login che notify sono funzioni di App.tsx passate tramite il contesto AppCtx
    } catch (err: any) { //se le op di login o registrazione falliscono, prendo l'errore e ne mostro il messaggio all'utente
      setErrore(err.message || "Operazione non riuscita");
    }
  };

  return (
    <div className="row g-0 min-vh-100 bg-white">
      <section className="col-md-6 d-flex align-items-center text-white p-5"
        style={{ background: "linear-gradient(var(--bs-primary-text-emphasis), var(--bs-primary))" }}>
        <div> {/* pure fw-light è figo */}
          <h1 className="display-4 fw-bold"><i className="fa-solid fa-ticket me-3" />YouTicket</h1> {/* display-4 cambia la dimensione del testo, fw-bold lo rende grassetto */}
          <p className="lead fw-bold">Assistenza IT Politecnico semplice ed immediata.</p> {/* lead rende il testo più grande e in grassetto */}
          <p>Apri richieste, segui gli aggiornamenti e parla con il team tecnico.</p>
        </div>
      </section>

      <section className="col-md-6 d-flex align-items-center justify-content-center p-5">
        <div className="w-100" style={{ maxWidth: 420 }}>
          <h2 className="text-center mb-4">{isLogin ? "Accedi" : "Registrati"}</h2>

          {errore && <div className="alert alert-danger">{errore}</div>}

          <form onSubmit={submit}>
            {isLogin ? ( //se l'utente è in modalità login mostro solo il campo username 
            // altrimenti mostro i campi nome, cognome, email e ruolo per registrazione
              <input className=" form-control mb-3" placeholder="Username" autoComplete="off"
                value={form.username} onChange={e => set("username", e.target.value)} required />
            ) : (
              <> {/* nel ternario posso ritornare un solo elemento quindi uso un fragment <>...</> 
              per raggruppare più elementi senza aggiungere un nodo extra al DOM*/}
                <div className="form-text mb-2">Ruolo</div>
                {/* se volessi mettere ruolo orizzontalmente usa col-auto 
                //prende lo la larghezza del contenuto, col-auto per il label e col per il select */}
                <select className="form-select" value={form.ruolo} onChange={e => set("ruolo", e.target.value)}>
                  <option value="UTENTE">Studente / Docente</option> 
                  <option value="TECNICO">Tecnico IT</option>
                </select>
                <div className="form-text mb-3">
                  Username: {form.ruolo === "UTENTE" ? "nome.cognome" : "tech.nome.cognome"}
                </div>
                <div className="row g-2 mb-3"> {/* g-2 è per lo spazio tra gli elementi (gx-2 per lo spazio orizzontale, gy-2 per lo spazio verticale) */}
                  {/* Wrappo con col per avere allineamento orizzontale*/}
                  <div className="col"> {/* prendo metà spazio*/}
                    <input className="form-control" placeholder="Nome"
                      value={form.nome} onChange={e => set("nome", e.target.value)} required />
                    <div className="form-text">Es. Mario</div>
                  </div>
                  <div className="col"> {/* prendo metà spazio*/} 
                    <input className="form-control" placeholder="Cognome"
                      value={form.cognome} onChange={e => set("cognome", e.target.value)} required />
                      {/* ogni volta che l'utente scrive qualcosa nel campo, aggiorno lo stato form con il nuovo */}
                    <div className="form-text">Es. Rossi</div>
                  </div>
                </div>
                <input className="form-control" placeholder="Email istituzionale"
                  value={form.email} onChange={e => set("email", e.target.value)} required />
                <div className="form-text mb-3">
                  {form.ruolo === "UTENTE" ? "Es. nome.cognome@mail.polimi.it o nome.cognome@polimi.it" : "Es. nome.cognome@service.polimi.it"}
                </div>
              </>
            )}

            <div className="position-relative">
              <input className="form-control pe-5" type={mostraPassword ? "text" : "password"} placeholder="Password"
                autoComplete="off" value={form.password} onChange={e => set("password", e.target.value)} required />
              <button type="button" onClick={() => setMostraPassword(!mostraPassword)}
                className="btn border-0 bg-transparent text-secondary position-absolute top-50 end-0 translate-middle-y"
                aria-label={mostraPassword ? "Nascondi password" : "Mostra password"}>
                <i className={`fa-solid ${mostraPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
            <div className="form-text mb-3">Minimo 8 caratteri.</div>

            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold">
              <i className={`fa-solid ${isLogin ? "fa-right-to-bracket" : "fa-user-plus"} me-2`} />{isLogin ? "Accedi" : "Registrati"}
            </button>
          </form>

          <p className="text-center mt-3 text-muted"> {/* con muted il testo diventa grigio chiaro, con mt-3 aggiungo margine sopra*/}
            {isLogin ? "Non hai un account?" : "Hai già un account?"}
            <button type="button" className="btn btn-link" onClick={() => { setIsLogin(!isLogin); setErrore(""); }}>
              {isLogin ? "Crea account" : "Accedi"}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
