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

  const login = (u: User) => {
    localStorage.setItem("utente", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("utente");
    setUser(null);
  };

  const notify = (testo: string) => {
    setMsg(testo);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <AppCtx.Provider value={{ user, login, logout, notify }}>
      <div>
        {user && (
          <nav className="navbar bg-white border-bottom shadow-sm px-4">
            <h2 className="navbar-brand m-0">YouTicket</h2>
            <div>
              <span className="me-3">{user.nome || user.username} ({user.ruolo})</span>
              <button onClick={logout} className="btn btn-outline-secondary">Esci</button>
            </div>
          </nav>
        )}

        {msg && (
          <div className="alert alert-success shadow fw-bold position-fixed bottom-0 end-0 m-3" style={{ zIndex: 9999 }}>{msg}</div>
        )}

        {user ? (
          <main className="container py-4">
            <Dashboard />
          </main>
        ) : (
          <Auth />
        )}
      </div>
    </AppCtx.Provider>
  );
}
