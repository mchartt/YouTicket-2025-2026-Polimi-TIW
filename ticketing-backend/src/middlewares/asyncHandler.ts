export const asyncHandler = (fn: any) => (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next);
//Wrapper che avvolge le funzioni asincrone che aiuta a gestire gli errori | se la funzione genera un errore, lo passo al middleware globale per gestire gli errori
//questo perché in nodejs non c'è il try catch per gestire gli errori in funzioni asincrone

/* PERCHE' UTIILIZZO async e await?
- Per via del db, mentre Nodejs è estramente rapido le operazioni di lettura e scrittura su db posso richiedere qualche millisecondo, un tempo lunghissimo per  servire richieste,
con async andiamo a dire a nodejs "Ehi sveglia nel mentre servi anche le altre richieste", con await invece aspettiamo che le richiesta venga processa pirma di fornire i dati, in modo
tale da non fornire un piatto vuoto a chi richiede i dati elaborati.
*/
