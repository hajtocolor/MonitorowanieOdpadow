# 🏠 Przeniesienie aplikacji z Railway/Vercel do lokalnej chmury firmowej

Ten dokument opisuje krok po kroku, jak uruchomić WasteTrack w pełni lokalnie — bez zależności od Railway i Vercel.

---

## Spis treści

1. [Architektura docelowa](#1-architektura-docelowa)
2. [Wymagania](#2-wymagania)
3. [Opcja A: Pojedynczy serwer (Ubuntu/Debian) — nginx + systemd](#3-opcja-a-pojedynczy-serwer)
4. [Opcja B: Docker (portowalny, rekomendowany)](#4-opcja-b-docker)
5. [Konfiguracja po uruchomieniu](#5-konfiguracja-po-uruchomieniu)
6. [Zadania po migracji](#6-zadania-po-migracji)

---

## 1. Architektura docelowa

```
┌─────────────────────────────────────────────────────┐
│                   Użytkownik                         │
│              (przeglądarka w firmie)                  │
└─────────────┬───────────────────────────┬────────────┘
              │                           │
              ▼                           ▼
┌──────────────────────┐    ┌──────────────────────────┐
│   Frontend (SPA)     │    │   Backend API            │
│   nginx serwuje       │───▶│   Express / Node.js      │
│   pliki statyczne    │    │   http://localhost:4000   │
│   port 80 / 443      │    │   (lub unix socket)       │
└──────────────────────┘    └──────────┬───────────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │   Supabase        │
                              │   (PostgreSQL)    │
                              │   hostowany       │
                              │   przez firmę     │
                              └──────────────────┘
```

**Kluczowe zmiany względem obecnego setupu (Railway + Vercel):**

| Obecnie | Po migracji |
|---|---|
| Frontend na Vercel | Frontend na firmowym nginx |
| Backend na Railway | Backend jako systemd service lub Docker |
| Auto-deploy z GitHub | Ręczny deploy lub własny CI/CD |
| Vercel daje darmowy SSL | Własny certyfikat Let's Encrypt |
| Railway ustawia PORT=8080 | Ustawiamy PORT=4000 w .env.local |
| Railway proxy + trust proxy | Własny nginx + trust proxy |

---

## 2. Wymagania

### Serwer (minimalne)
- **OS:** Ubuntu 22.04 LTS (lub Debian 12) — inne dystrybucje też działają, ale komendy będą się różnić
- **CPU:** 1 vCPU (2 zalecane)
- **RAM:** 1 GB (2 GB zalecane)
- **Dysk:** 10 GB
- **Node.js:** >= 20
- **npm:** wersja z Node.js
- **nginx** (dla reverse proxy)
- **Git** (do klonowania repo)

### Oprogramowanie na serwerze
```bash
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx

# Sprawdź wersje
node -v   # >= 20.x
npm -v    # >= 10.x
nginx -v  # >= 1.24
```

### Supabase (baza danych)
Aplikacja **wymaga** Supabase — jest to zewnętrzna usługa PostgreSQL z API REST. Możesz:
- **Zostawić obecne konto Supabase** (darmowe, 2 projekty) — aplikacja dalej będzie z niego korzystać, tylko frontend i backend będą lokalne
- **Przenieść bazę na firmowy PostgreSQL** — wtedy trzeba skonfigurować własne REST API (opcja zaawansowana)

**Zalecenie:** Zostaw Supabase jako zewnętrzną bazę — to upraszcza migrację i nie wymaga zmian w kodzie. Supabase ma darmowy tier (500 MB danych, 2 projekty).

---

## 3. Opcja A: Pojedynczy serwer (Ubuntu)

### 3.1. Przygotowanie katalogów i klonowanie

```bash
# Katalog docelowy
sudo mkdir -p /opt/wastetrack
sudo chown $USER:$USER /opt/wastetrack

# Sklonuj repozytorium
git clone https://github.com/hajtocolor/MonitorowanieOdpadow.git /opt/wastetrack
cd /opt/wastetrack
```

### 3.2. Instalacja zależności i budowa

```bash
# Backend
cd backend
npm install
npx tsc
cd ..

# Frontend
npm install
npm run build   # <- to tworzy katalog dist/ z gotowymi plikami HTML+JS+CSS
```

### 3.3. Konfiguracja zmiennych środowiskowych

```bash
cp .env.example /opt/wastetrack/.env.local
nano /opt/wastetrack/.env.local
```

**Zawartość `.env.local`:**

```env
# === SUPABASE (obowiązkowe) ===
# Weź z supabase.com → Settings → API
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# === JWT ===
JWT_SECRET=WYgenerujLosowyCiągZnakówMinimum32Znaki

# === HASŁA ===
ADMIN_PASSWORD=admin123
WORKER_PASSWORD=worker123

# === CORS ===
# WAŻNE: ustaw adres, pod którym będzie dostępny frontend
# Jeśli nie masz jeszcze domeny, na razie wpisz http://<IP_SERWERA>
CORS_ORIGIN=http://192.168.1.100

# === PORT (opcjonalnie) ===
# Domyślnie backend uruchomi się na porcie 4000
# Railway używa 8080 — tutaj ustawiamy 4000
PORT=4000

# === POWIADOMIENIA (opcjonalnie) ===
SLACK_WEBHOOK_URL=
NTFY_TOPIC=
```

### 3.4. Backend jako usługa systemd

```bash
sudo nano /etc/systemd/system/wastetrack-backend.service
```

**Treść:**

```ini
[Unit]
Description=WasteTrack Backend API
Documentation=https://github.com/hajtocolor/MonitorowanieOdpadow
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/wastetrack/backend
EnvironmentFile=/opt/wastetrack/.env.local
ExecStart=/usr/bin/node /opt/wastetrack/backend/dist/server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

# Bezpieczeństwo
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
# Włącz i uruchom
sudo systemctl daemon-reload
sudo systemctl enable wastetrack-backend
sudo systemctl start wastetrack-backend

# Sprawdź
sudo systemctl status wastetrack-backend
journalctl -u wastetrack-backend -f   # podgląd logów
```

### 3.5. nginx — serwowanie frontendu i proxy dla API

```bash
sudo nano /etc/nginx/sites-available/wastetrack
```

**Treść:**

```nginx
server {
    listen 80;
    server_name _;  # _ = dowolna domena/IP

    # ---------- Frontend (zbudowane pliki Vite) ----------
    root /opt/wastetrack/dist;
    index index.html;

    # Obsługa SPA — wszystkie ścieżki poza /api trafiają do index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ---------- Backend API ----------
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Ważne: zwiększamy limit dla większych zapytań
        client_max_body_size 10m;
    }
}
```

**Włącz stronę:**

```bash
sudo ln -s /etc/nginx/sites-available/wastetrack /etc/nginx/sites-enabled/
sudo nginx -t                 # sprawdź konfigurację
sudo systemctl reload nginx   # przeładuj bez przerwy
```

### 3.6. Firewall

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS (jeśli SSL)
sudo ufw enable
```

### 3.7. SSL (Let's Encrypt) — jeśli masz domenę

Jeśli serwer ma domenę (np. `wastetrack.firma.pl`):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d wastetrack.firma.pl

# Automatyczne odświeżanie certyfikatu
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

Jeśli nie masz domeny — możesz używać po HTTP przez IP (działa w sieci lokalnej).

### 3.8. Otwarcie w przeglądarce

- Jeśli masz domenę: `https://wastetrack.firma.pl`
- Jeśli po IP: `http://<IP_SERWERA>`
- Jeśli lokalnie na serwerze: `http://localhost`

---

## 4. Opcja B: Docker

### 4.1. Plik `docker-compose.yml`

Utwórz w głównym katalogu projektu:

```bash
nano /opt/wastetrack/docker-compose.yml
```

**Treść:**

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: ../Dockerfile.backend
    ports:
      - "4000:4000"
    env_file:
      - .env.local
    environment:
      - PORT=4000
    restart: unless-stopped
    networks:
      - wastetrack

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - wastetrack

networks:
  wastetrack:
    driver: bridge
```

### 4.2. `Dockerfile.backend`

Utwórz w katalogu `backend/`:

```bash
nano /opt/wastetrack/Dockerfile.backend
```

```dockerfile
FROM node:22-alpine AS build
WORKDIR /build
COPY backend/package*.json ./
RUN npm install
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npx tsc

FROM node:22-alpine
WORKDIR /app
COPY --from=build /build/dist ./dist
COPY --from=build /build/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

### 4.3. `Dockerfile.frontend`

Utwórz w głównym katalogu:

```bash
nano /opt/wastetrack/Dockerfile.frontend
```

```dockerfile
# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Production stage (nginx) ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-docker.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 4.4. `nginx-docker.conf`

Utwórz w głównym katalogu:

```bash
nano /opt/wastetrack/nginx-docker.conf
```

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API — w docker compose nazwa serwera to "backend"
    location /api/ {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10m;
    }
}
```

### 4.5. Uruchomienie Docker

```bash
# Zainstaluj Dockera (jeśli nie ma)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # wyloguj i zaloguj ponownie

# Uruchom
cd /opt/wastetrack
docker compose up -d

# Sprawdź
docker compose ps
docker compose logs -f
```

### 4.6. SSL z Docker + Traefik (opcjonalnie)

Jeśli masz domenę i chcesz SSL z Dockerem — najlepiej dodać Traefik jako reverse proxy z automatycznym Let's Encrypt:

```yaml
# docker-compose.yml — rozszerzenie o Traefik
services:
  traefik:
    image: traefik:v3.0
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./traefik.yml:/etc/traefik/traefik.yml
    labels:
      - "traefik.enable=true"

  frontend:
    labels:
      - "traefik.http.routers.frontend.rule=Host(`wastetrack.firma.pl`)"
      - "traefik.http.routers.frontend.tls=true"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
```

---

## 5. Konfiguracja po uruchomieniu

### 5.1. Supabase — tabele

Niezależnie od wybranej metody, musisz utworzyć tabele w Supabase (jeśli jeszcze nie istnieją).

Wejdź na [supabase.com](https://supabase.com) → SQL Editor i uruchom:

```sql
-- 1. Tabela entries (istniejące wpisy odpadów)
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  "machineId" TEXT NOT NULL,
  "classificationNumber" TEXT NOT NULL,
  "binNumber" TEXT NOT NULL,
  reason TEXT NOT NULL,
  "weightKg" DOUBLE PRECISION NOT NULL,
  comment TEXT,
  "createdAt" TEXT NOT NULL
);

-- 2. Tabela bin_requests (zgłoszenia pełnych pojemników)
-- Uruchom zawartość pliku: backend/src/scripts/create-bin-requests-table.sql

-- 3. Tabela bins (definicje pojemników)
-- Uruchom zawartość pliku: backend/src/scripts/create-bins-table.sql
```

### 5.2. Weryfikacja

Po uruchomieniu sprawdź, czy wszystko działa:

```bash
# Backend (z serwera)
curl http://localhost:4000/api/health
# → {"ok":true}

# Backend przez nginx proxy
curl http://localhost/api/health
# → {"ok":true}

# Frontend (przez przeglądarkę)
# Otwórz http://<IP_SERWERA>
# Powinna pokazać się strona logowania
```

---

## 6. Zadania po migracji

### 6.1. Aktualizacja `vite.config.ts` (przed budową)

W pliku `vite.config.ts` ustaw proxy deweloperskie — ale dla produkcji to nie jest potrzebne, bo nginx proxy robi to za Vite.

**Ważne:** Przed `npm run build` sprawdź, czy `src/api.ts` ma prawidłowy `VITE_API_URL`. W produkcji frontend wysyła requesty na `/api/...`, które nginx przekierowuje do backendu. Nie musisz ustawiać `VITE_API_URL` — domyślnie jest `/api`.

### 6.2. Backup bazy danych

Supabase ma wbudowane backup'y (Project Settings → Database → Backups). Jeśli używasz własnego PostgreSQL:

```bash
pg_dump --host=localhost --port=5432 --username=wastetrack --password wastetrack > backup-$(date +%Y%m%d).sql
```

### 6.3. Monitoring logów

```bash
# systemd
journalctl -u wastetrack-backend -f --output cat

# Docker
docker compose logs -f
```

### 6.4. Restart po zmianie konfiguracji

```bash
# systemd
sudo systemctl restart wastetrack-backend

# nginx (po zmianie konfiguracji)
sudo nginx -t && sudo systemctl reload nginx

# Docker
docker compose restart
```

### 6.5. Co zrobić, gdy backend nie startuje

```bash
# 1. Sprawdź logi
journalctl -u wastetrack-backend -n 50 --no-pager

# 2. Najczęstsze błędy:
# "Brak konfiguracji Supabase" → .env.local ma puste SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
# "Ustaw JWT_SECRET" → JWT_SECRET nie jest ustawiony
# "Ustaw ADMIN_PASSWORD i WORKER_PASSWORD" → brak haseł w .env.local

# 3. Jeśli CORS_ORIGIN jest nieprawidłowe:
# Zmień w .env.local na adres, pod którym działa frontend
# np. CORS_ORIGIN=http://192.168.1.100 (bez / na końcu!)

# 4. Restart usługi po zmianie .env.local
sudo systemctl restart wastetrack-backend
```

---

## Porównanie metod

| Kryterium | Opcja A (systemd) | Opcja B (Docker) |
|---|---|---|
| Łatwość setupu | ★★★★ (prosty) | ★★★ (więcej plików) |
| Izolacja | ★★★ (współdzieli system) | ★★★★★ (w pełni izolowany) |
| Aktualizacja | ★★★ (ręczny restart) | ★★★★★ (docker compose down/up) |
| Zużycie zasobów | ★★★★ (mniejsze) | ★★★ (więcej warstw) |
| Przenośność | ★★ (tylko Ubuntu/Debian) | ★★★★★ (dowolny Linux, Windows, Mac) |
| Backup/Migracja | ★★★ (wymaga reinstalacji) | ★★★★★ (docker compose tylko) |

---

## Podsumowanie

1. **Sklonuj** repo na serwer
2. **Zainstaluj** Node.js + npm
3. **Skonfiguruj** `.env.local` z danymi Supabase
4. **Zbuduj** backend (`cd backend && npx tsc`) i frontend (`npm run build`)
5. **Uruchom** backend (systemd lub Docker)
6. **Skonfiguruj** nginx jako reverse proxy
7. **Ustaw** SSL (Let's Encrypt) jeśli masz domenę
8. **Gotowe** — aplikacja działa bez Railway i Vercel

Cały proces (na czystym Ubuntu) zajmuje około **30-45 minut**.