//middleware per le pagine EJS: chi non è loggato torna al login (sostituisce il controllo "user" del Context React)
export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.user) return res.redirect("/login");
  next();
};
