import { useState, useContext } from "react";
import { AppCtx } from "../context/AppContext";
import { api } from "../services/api";

export default function Auth() {
  const { login, notify } = useContext(AppCtx);

  const [isLogin, setIsLogin] = useState(true);

  const [form, setForm] = useState({
    username: "", password: "", nome: "", cognome: "", email: "", ruolo: "UTENTE"
  });

  const [errore, setErrore] = useState("");

  const set = (campo: string, valore: string) => setForm({ ...form, [campo]: valore });

  const submit = async (e: any) => {
    e.preventDefault();
    setErrore("");

    try {
      const dati = isLogin
        ? await api.login({ username: form.username, password: form.password })
        : await api.register({
            nome: form.nome,
            cognome: form.cognome,
            email: form.email,
            password: form.password,
            ruolo: form.ruolo
          });

      login(dati);
      notify(isLogin ? "Accesso effettuato" : "Registrazione completata");
    } catch (err: any) {
      setErrore(err.message || "Operazione non riuscita");
    }
  };

  return (
    <div className="row g-0 min-vh-100 bg-white">
      <section className="col-md-6 d-flex align-items-center text-white p-5"
        style={{ background: "linear-gradient(var(--bs-primary-text-emphasis), var(--bs-primary))" }}>
        <div>
          <h1 className="display-4 fw-bold">YouTicket</h1>
          <p className="lead fw-bold">Assistenza IT semplice e tracciata.</p>
          <p>Apri richieste, segui gli aggiornamenti e parla con il team tecnico.</p>
        </div>
      </section>

      <section className="col-md-6 d-flex align-items-center justify-content-center p-5">
        <div className="w-100" style={{ maxWidth: 420 }}>
          <h2 className="text-center mb-4">{isLogin ? "Accedi" : "Registrati"}</h2>

          {errore && <div className="alert alert-danger">{errore}</div>}

          <form onSubmit={submit}>
            {isLogin ? (
              <input className="form-control mb-3" placeholder="Username"
                value={form.username} onChange={e => set("username", e.target.value)} required />
            ) : (
              <>
                <select className="form-select" value={form.ruolo} onChange={e => set("ruolo", e.target.value)}>
                  <option value="UTENTE">Studente / Docente</option>
                  <option value="TECNICO">Tecnico IT</option>
                </select>
                <div className="form-text mb-3">
                  Username: {form.ruolo === "UTENTE" ? "nome.cognome" : "tech.nome.cognome"}
                </div>
                <div className="row g-2 mb-3">
                  <div className="col">
                    <input className="form-control" placeholder="Nome"
                      value={form.nome} onChange={e => set("nome", e.target.value)} required />
                    <div className="form-text">Es. Mario</div>
                  </div>
                  <div className="col">
                    <input className="form-control" placeholder="Cognome"
                      value={form.cognome} onChange={e => set("cognome", e.target.value)} required />
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

            <input className="form-control" type="password" placeholder="Password"
              value={form.password} onChange={e => set("password", e.target.value)} required />
            <div className="form-text mb-3">Minimo 8 caratteri.</div>

            <button type="submit" className="btn btn-primary w-100 py-2 fw-bold">
              {isLogin ? "Accedi" : "Registrati"}
            </button>
          </form>

          <p className="text-center mt-3 text-muted">
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
