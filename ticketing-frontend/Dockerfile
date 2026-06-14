# Dockerfile ottimizzato per il Frontend (React + Vite)
# Build in modalità produzione per massima efficienza

# Stage 1: Build
FROM node:20-alpine AS build
# Svuota la cartella di default di Nginx prima di copiare la nuova app
RUN rm -rf /usr/share/nginx/html/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Passaggio variabili d'ambiente per la build di Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Crea la cartella /dist con i file statici pronti per il web
RUN npm run build

# Stage 2: Serve
# Usiamo Nginx per servire i file statici, approccio professionale e veloce
FROM nginx:stable-alpine
# Copia la build dallo stage precedente alla cartella di Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Configurazione base per SPA (Single Page Application)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
