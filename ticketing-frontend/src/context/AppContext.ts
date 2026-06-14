import { createContext } from "react";

export const AppCtx = createContext<any>(null);  //null valore di default che assume se non ci fosse il Provider, ma in realtà sarà sempre valorizzato da App.tsx
//contenitore globale per dati e funzioni condivise tra componenti:
//come utente loggato, funzioni di login/logout e notifiche.
