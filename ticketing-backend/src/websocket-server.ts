import { WebSocketServer, WebSocket } from "ws";

//Per ogni ticket tengo l'insieme delle connessioni aperte sulla sua chat.
//Così quando arriva un commento nuovo lo mando solo a chi sta guardando quel ticket.
const stanze = new Map<number, Set<WebSocket>>();

export function initWs(server: any) { //collego il server WebSocket allo stesso server HTTP di Express
  const wss = new WebSocketServer({ server });
  wss.on("connection", socket => {
    let ticketId: number | null = null;
    socket.on("message", raw => {
      //il client manda { ticketId } per dire quale chat sta seguendo
      try {
        ticketId = Number(JSON.parse(raw.toString()).ticketId);
        if (!stanze.has(ticketId)) stanze.set(ticketId, new Set());
        stanze.get(ticketId)!.add(socket);
      } catch {
        //messaggio non valido: lo ignoro
      }
    });
    socket.on("close", () => { if (ticketId !== null) stanze.get(ticketId)?.delete(socket); }); //alla chiusura tolgo la connessione dalla stanza
  });
}

//invio il nuovo commento a tutte le connessioni che stanno guardando quel ticket
export function inviaCommento(ticketId: number, commento: any) {
  const stanza = stanze.get(ticketId);
  if (!stanza) return;
  const dati = JSON.stringify(commento);
  for (const socket of stanza) if (socket.readyState === WebSocket.OPEN) socket.send(dati);
}
