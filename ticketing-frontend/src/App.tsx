import { useState, useEffect } from "react";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import { AppCtx } from "./context/AppContext";
import type { User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [msg, setMsg] = useState(""); 

  useEffect(() => {
    const saved = localStorage.getItem("utente");
    if (saved) setUser(JSON.parse(saved));
  }, []);


  //RICORDATI: localStorage è un oggetto che permette di salvare dati nel browser dell'utente,
  //  in modo che siano disponibili anche dopo la chiusura del browser o il refresh della pagina.
  //ESEMPIO:
  // - localStorage. setItem("utente", JSON. stringify(u)) - salva l'utente loggato
  // - localStorage.getItem("utente") - recupera l'utente al refresh della pagina (nel useEffect) 
  // - localStorage. removeItem("utente") - cancella l'utente al logout
  //  In questo caso, viene utilizzato per salvare le informazioni dell'utente loggato,
  //  in modo da poterle recuperare al successivo accesso all'applicazione.

  //DEFINISCO LE FUNZIONI DI LOGIN, LOGOUT E NOTIFICA CHE SARANNO DISPONIBILI IN TUTTA L'APP TRAMITE IL CONTEXTO AppCtx
  const login = (u: User) => {
    localStorage.setItem("utente", JSON.stringify(u));
    setUser(u);
  };

  //funzione di logout che rimuove l'utente dal localStorage e setta user a null
  const logout = () => {
    localStorage.removeItem("utente");
    setUser(null);
  };

  //prendo in input testo notifica la passo a setMsg che la imposta su msg 
  //e dopo 3 secondi la rimuovo 
  const notify = (testo: string) => {
    setMsg(testo);
    setTimeout(() => setMsg(""), 3000);
  };


  return (
    //CREO IL CONTESTO GLOBALE AppCtx E LO VALORIZZO CON I DATI DELL'UTENTE LOGGATO E LE FUNZIONI DI LOGIN, LOGOUT E NOTIFICA
    <AppCtx.Provider value={{ user, login, logout, notify }}>
      <div>
        {/*---------NAVBAR----------------*/}
        {user && ( //se l'utente è loggato allora mostro la navbar con nome utente, ruolo e pulsante di logout
          <nav className="navbar bg-white border-bottom shadow-sm px-4">
            <h2 className="navbar-brand m-0"><i className="fa-solid fa-ticket text-primary me-2" />YouTicket</h2>
            <div> {/* mostro nome utente e ruolo, se è presente il nome completo mostro quello altrimenti username*/}
              <span className="me-3">{user.nome || user.username} ({user.ruolo})</span>
              <button onClick={logout} className="btn btn-outline-secondary"><i className="fa-solid fa-right-from-bracket me-2" />Esci</button>
            </div>
          </nav>
        )}

        {/* se mi sono qui è perché sono loggato allora mando notifica*/} 
        {/*---------NOTIFICA----------------*/}
        {msg && (
          <div className="alert alert-success shadow fw-bold position-fixed bottom-0 end-0 m-3" style={{ zIndex: 9999 }}>{msg}</div>
        )}



        {/*---------CONTENUTO PRINCIPALE----------------*/}
        {user ? ( //se l'utente è loggato allora mostro il dashboard altrimenti mostro il form di login/registrazione
          <main className="container py-4"> {/* con py-4 lascia un po' di spazio verticale sopra e sotto */}
            <Dashboard />
          </main>
        ) : ( 
          <Auth />
        )}
      </div>
    </AppCtx.Provider>
  );
}
