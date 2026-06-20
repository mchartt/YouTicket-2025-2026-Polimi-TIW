import multer from "multer";

//upload allegati della nuova richiesta: tengo i file in memoria, poi li converto in data URL
//così riuso aggiungiAllegato esistente (che vuole { nomeFile, tipo, dati }) senza modifiche.
//il limite "max 5MB" vero resta nel service; qui un tetto generoso come express.json.
export const caricamentoFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

//multer "morbido": se l'upload supera il limite non lascio andare un 500, ma segnalo l'errore all'handler
export const caricaAllegati = (req: any, res: any, next: any) =>
  caricamentoFile.array("allegati")(req, res, (err: any) => {
    if (err) req.erroreUpload = "File troppo grande (max 5MB)"; //es. multer LIMIT_FILE_SIZE
    next();
  });
