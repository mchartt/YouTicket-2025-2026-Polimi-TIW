# Dockerfile semplificato per il Backend (Node.js + Prisma)
FROM node:20-slim

# Installazione minima necessaria per Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia solo i file necessari per le dipendenze (ottimizza la cache di Docker)
COPY package*.json ./
COPY prisma ./prisma/

# Installazione pacchetti e generazione automatica del client Prisma
RUN npm install
RUN npx prisma generate

# Copia tutto il resto del codice
COPY . .

# Compila TypeScript in JavaScript
RUN npm run build

EXPOSE 8080

# Comando di avvio standard
CMD ["sh", "-c", "npx prisma db push && npm start"]
