import { Server } from "socket.io";

//Server socket.io agganciato allo stesso server HTTP di Express.
//Ogni client entra nella "stanza" del ticket che sta guardando, così i commenti nuovi
//arrivano solo a chi segue quel ticket.
let io: Server | null = null;

const stanza = (ticketId: number) => "ticket:" + ticketId; //nome stanza per ticket

export function initWs(server: any) { //collego socket.io allo stesso server HTTP
  io = new Server(server); //stessa origine (host:porta), niente CORS da configurare
  io.on("connection", socket => {
    //il client manda "join" con l'id del ticket che sta seguendo
    socket.on("join", (ticketId: any) => {
      socket.join(stanza(Number(ticketId)));
    });
    //l'uscita dalla stanza alla disconnessione la gestisce socket.io da solo
  });
}

//invio il nuovo commento a tutte le connessioni che stanno guardando quel ticket
export function inviaCommento(ticketId: number, commento: any) {
  io?.to(stanza(ticketId)).emit("commento", commento);
}
