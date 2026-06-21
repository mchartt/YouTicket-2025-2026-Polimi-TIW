import { Server } from "socket.io";

//Con Socket.IO ogni ticket ha la sua "stanza": chi apre la chat di un ticket entra nella stanza di quel ticket.
//Così quando arriva un commento nuovo lo mando solo a chi sta guardando quel ticket.
let io: Server;

const nomeStanza = (ticketId: number) => `ticket:${ticketId}`; //nome univoco della stanza per ogni ticket

export function initWs(server: any) { //collego Socket.IO allo stesso server HTTP di Express
  const corsOrigin = process.env.CORS_ORIGIN || "*"; //stesse origini permesse dall'API
  const origins = corsOrigin === "*" ? "*" : corsOrigin.split(",").map(s => s.trim());
  io = new Server(server, { cors: { origin: origins } });

  io.on("connection", socket => {
    //il client manda "seguiTicket" con l'id per dire quale chat sta seguendo
    socket.on("seguiTicket", (ticketId: number) => socket.join(nomeStanza(ticketId)));
    //all'uscita dal ticket Socket.IO toglie da solo la connessione dalla stanza
  });
}

//invio il nuovo commento a tutte le connessioni che stanno guardando quel ticket
export function inviaCommento(ticketId: number, commento: any) {
  io.to(nomeStanza(ticketId)).emit("nuovoCommento", commento);
}
