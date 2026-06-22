import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Estendiamo l'interfaccia Request per includere l'utente (i campi messi nel token)
export interface AuthRequest extends Request {
  user?: { id: number; username: string; ruolo: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token mancante o non valido" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ["HS256"] }); //secret obbligatorio + algoritmo fissato (no algorithm-confusion)
    req.user = payload as AuthRequest["user"]; // Iniettiamo l'utente!
    next();
  } catch (err) {
    res.status(401).json({ error: "Token scaduto o non valido" });
    return;
  }
};

// Consente l'accesso solo a un ruolo specifico (usare DOPO requireAuth)
export const requireRole = (ruolo: string) => (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.ruolo !== ruolo) {
    res.status(403).json({ error: "Permessi insufficienti" });
    return;
  }
  next();
};
