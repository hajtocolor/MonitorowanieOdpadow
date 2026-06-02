# Deployment & Hosting — WasteTrack

Ten dokument opisuje kroki, jakie trzeba wykonać, aby przygotować i wdrożyć aplikację WasteTrack do środowiska produkcyjnego.

## Założenia
- Frontend i backend mogą być hostowane osobno (np. frontend na Netlify/Vercel/NGINX, backend na VPS/Heroku/Docker host).
- Backend używa Supabase jako zdalnej bazy danych. Dzięki temu nie ma lokalnego pliku SQLite.

## Wymagania (przykładowe)
- Node.js >= 18
- npm >= 9
- serwer (VPS) lub platforma hostująca (Heroku, Railway, Render itp.)
- (opcjonalnie) Docker i docker-compose

## Produckja — budowanie frontendu
1. Zainstaluj zależności i zbuduj frontend:

```bash
cd /path/to/factory-waste-tracking-system
npm install
npm run build
```

2. Wynikowy statyczny bundle znajduje się w `dist/` (config może korzystać z `vite-plugin-singlefile` — w repo może generować pojedynczy plik `.html`). Ten `dist/` możesz wrzucić na dowolny hosting statyczny (Netlify, Vercel, S3 + CloudFront, serwer NGINX).

3. Jeżeli chcesz serwować frontend z tego samego serwera co backend, skopiuj zawartość `dist/` do katalogu serwowanego przez NGINX lub dodaj prosty middleware Express obsługujący pliki statyczne.

## Produkcja — backend
1. Przejdź do folderu `backend` i zainstaluj zależności:

```bash
cd backend
npm install
```

2. Możesz uruchomić backend w trybie produkcyjnym po zbudowaniu:

```bash
npm run build
NODE_ENV=production node dist/server.js
```

3. Możesz też uruchomić serwer bez budowania za pomocą `node`/PM2/forever lub zbudować obraz Docker (przykład poniżej).

### Przykładowy `Dockerfile` (backend)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

### Przykładowy `docker-compose.yml` (frontend jako statyczny kontener + backend)

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    volumes:
      - ./backend/data:/app/data
  frontend:
    image: nginx:stable-alpine
    volumes:
      - ./dist:/usr/share/nginx/html:ro
    ports:
      - "80:80"
```

> Uwaga: backend nie używa już lokalnego pliku SQLite. Zamiast tego dane są przechowywane w Supabase.

## Reverse proxy, CORS i HTTPS
- Jeśli frontend i backend działają na różnych domenach lub portach, ustaw CORS i/lub reverse proxy (NGINX) aby przekierować `/api` do backendu.
- W przypadku hostowania na VM/VPS, skonfiguruj NGINX jako reverse-proxy i TLS (Let's Encrypt Certbot). Przykład prostego location:

```
location /api/ {
  proxy_pass http://127.0.0.1:4000/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}

location / {
  root /var/www/wastetrack/dist;
  try_files $uri /index.html;
}
```

## Zmienne środowiskowe i bezpieczeństwo
- W obecnej wersji hasła są zakodowane w plikach. PRZY WDROŻENIU:
  - Usuń jawne hasła i wdróż mechanizm bezpiecznego przechowywania użytkowników (BD, hashowanie bcrypt, JWT lub sesje).
  - Ustaw `NODE_ENV=production`.

## Backup i migracja bazy danych
- Dane są teraz przechowywane w Supabase, dlatego zadbaj o backup i politykę retention w projekcie Supabase.
- Jeżeli migrujesz dane z istniejącego lokalnego SQLite, przygotuj skrypt lub narzędzie, które przeniesie je do tabeli `entries` w Supabase.

## Szybki checklist deploy (VPS)
- [ ] Skonfiguruj serwer (Node, NGINX, Certbot)
- [ ] Sklonuj repozytorium
- [ ] Zainstaluj zależności backendu i frontendu
- [ ] Zbuduj frontend (`npm run build`)
- [ ] Skonfiguruj NGINX do serwowania `dist/` i proxy do `/api`
- [ ] Uruchom backend pod proces managerem (PM2/systemd)
- [ ] Wykonaj testy end-to-end (frontend -> API)

## Gdzie można hostować
- Frontend: Netlify, Vercel, S3 + CloudFront, NGINX
- Backend: Heroku, Render, Railway, VPS (DigitalOcean, Hetzner), Docker host (AWS ECS, Docker Compose)

---
Plik `ADD_USER.md` opisuje, jak ręcznie dodać użytkownika (szybka metoda dev).