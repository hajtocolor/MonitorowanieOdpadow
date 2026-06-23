# Dodawanie nowego pracownika i nadawanie dostępu

> **Uwaga:** System używa już JWT z `jsonwebtoken` na backendzie i autoryzacji przez `Bearer` token na frontendzie. Hasła konfiguruje się przez zmienne środowiskowe (`ADMIN_PASSWORD`, `WORKER_PASSWORD`), a nie w kodzie.

## Szybki sposób — przez zmienne środowiskowe

Nowego pracownika (lub zmianę hasła) robi się przez ustawienie zmiennych środowiskowych na Railway:

1. Wejdź na [railway.app](https://railway.app) → projekt → serwis backendu → **Variables**
2. Ustaw (lub zmień):
   ```
   ADMIN_PASSWORD = nowe_haslo_admina
   WORKER_PASSWORD = nowe_haslo_pracownika
   ```
3. Railway automatycznie zrestartuje backend
4. Odśwież frontend — logowanie działa z nowymi hasłami

### Obsługa wielu kont z różnymi hasłami

Obecna implementacja wspiera tylko jedną parę haseł (admin + worker). Aby dodać wielu pracowników z indywidualnymi hasłami:

- **Opcja A (zalecana):** Stwórz tabelę `users` w Supabase z kolumnami `username`, `password_hash`, `role`, `created_at` i endpoint `POST /api/auth/register`
- **Opcja B (szybka, tylko do testów):** Dodaj zmienne `WORKER2_PASSWORD`, `WORKER3_PASSWORD` itd. w Railway Variables i rozszerz logikę logowania w `backend/src/server.ts`

## Jak działa autoryzacja (obecny stan)

| Element | Obecna implementacja |
|---|---|
| **Backend auth** | `POST /api/login` z `role` + `password` → zwraca JWT token (24h) |
| **Hasła** | W zmiennych środowiskowych (`ADMIN_PASSWORD`, `WORKER_PASSWORD`) |
| **Frontend auth** | `src/auth.ts` wysyła `fetch` do `/api/login`, zapisuje token w `localStorage` |
| **Nagłówek autoryzacji** | `Authorization: Bearer <token>` — ustawiany przez `getAuthHeaders()` w `src/api.ts` |
| **Weryfikacja backendu** | `authenticateToken` middleware weryfikuje JWT, `requireRole` sprawdza uprawnienia |
| **Endpointy publiczne** | `GET /api/health`, `GET /api/test`, `POST /api/login` |
| **Endpointy chronione** | Wszystkie pozostałe (entries, bin-requests, bins) |

## Rekomendowane podejście produkcyjne (wielu użytkowników)

Jeśli potrzebujesz wielu kont z różnymi hasłami, zaimplementuj:

1. **Tabela `users` w Supabase:**
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     username TEXT NOT NULL UNIQUE,
     password_hash TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('admin', 'worker')),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Endpointy:**
   - `POST /api/auth/register` — tworzy nowego użytkownika (tylko admin)
   - `POST /api/auth/login` — logowanie, zwraca JWT
   - `GET /api/users` — lista użytkowników (admin)
   - `PUT /api/users/:id/reset-password` — reset hasła (admin)

3. **Hashowanie haseł:** Użyj `bcrypt` (`npm install bcryptjs @types/bcryptjs`)

4. **Frontend:** `src/auth.ts` już wspiera ten flow — logowanie przez API, przechowywanie tokena, wysyłanie `Authorization: Bearer`.

---

# Uruchomienie lokalne / na chmurze firmowej

## Opcja 1: Lokalnie (dev)

### Wymagania
- Node.js >= 20
- npm
- Konto Supabase (darmowe)

### Krok po kroku

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/hajtocolor/MonitorowanieOdpadow.git
cd MonitorowanieOdpadow

# 2. Zainstaluj zależności
npm install          # frontend (Vite)
cd backend && npm install && cd ..  # backend (Express)

# 3. Skonfiguruj zmienne środowiskowe
cp .env.example .env.local
```

### 3a. `.env.local` — wypełnij danymi:

```env
# Supabase (obowiązkowe — utwórz darmowe konto na supabase.com)
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=twoj_service_role_key

# JWT Secret (dowolny długi, losowy ciąg)
JWT_SECRET=tajny_klucz_jwt_min_32_znaki

# Hasła logowania
ADMIN_PASSWORD=haslo_admina
WORKER_PASSWORD=haslo_pracownika

# CORS — domena frontendu (dla dev: http://localhost:5173)
CORS_ORIGIN=http://localhost:5173

# Opcjonalnie: webhook Slack i ntfy
SLACK_WEBHOOK_URL=
NTFY_TOPIC=
```

### 3b. Supabase — utwórz tabele

Wejdź na [supabase.com](https://supabase.com) → SQL Editor → uruchom te skrypty w kolejności:

```sql
-- backend/src/scripts/create-bin-requests-table.sql
-- backend/src/scripts/create-bins-table.sql
```

Jeśli tabela `entries` nie istnieje — dodaj ją:

```sql
CREATE TABLE entries (
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
```

### 4. Uruchom

```bash
# Terminal 1: backend (http://localhost:4000)
cd backend && npm run dev

# Terminal 2: frontend (http://localhost:5173)
npm run dev
```

Otwórz `http://localhost:5173` w przeglądarce. Zaloguj się jako admin lub worker.

## Opcja 2: Firmowa chmura / serwer wewnętrzny (np. Azure VM, Google Cloud, własny serwer)

### Architektura

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Frontend      │────▶│   Backend        │────▶│  Supabase    │
│ (Vite/React)    │     │ (Express/Node)   │     │  (PostgreSQL)│
│ port 80/443     │     │ port 8080        │     │  (chmura MS) │
└─────────────────┘     └──────────────────┘     └──────────────┘
        ▲                        │
        │                        ▼
  Użytkownik              Slack / ntfy.sh
  (przeglądarka)          (powiadomienia)
```

### Krok po kroku

#### 1. Przygotowanie serwera (Ubuntu/Debian przykładowo)

```bash
# Zainstaluj Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx

# Sklonuj repozytorium
git clone https://github.com/hajtocolor/MonitorowanieOdpadow.git /opt/wastetrack
cd /opt/wastetrack
```

#### 2. Zainstaluj zależności i zbuduj

```bash
# Backend
cd backend && npm install && npx tsc && cd ..

# Frontend
npm install && npm run build
```

#### 3. Konfiguracja

```bash
cp .env.example .env.local
nano .env.local   # wypełnij jak w Opcji 1
```

#### 4. Uruchom backend jako usługę systemd

```bash
sudo nano /etc/systemd/system/wastetrack-backend.service
```

Wklej:

```ini
[Unit]
Description=WasteTrack Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/wastetrack/backend
EnvironmentFile=/opt/wastetrack/.env.local
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable wastetrack-backend
sudo systemctl start wastetrack-backend
```

#### 5. Nginx jako reverse proxy (frontend + backend)

```bash
sudo nano /etc/nginx/sites-available/wastetrack
```

```nginx
server {
    listen 80;
    server_name wastetrack.firma.pl;  # lub IP

    # Frontend (zbudowane pliki)
    root /opt/wastetrack/dist;
    index index.html;

    # SPA — wszystkie ścieżki poza /api kierują do index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/wastetrack /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

#### 6. SSL (Let's Encrypt) — jeśli masz domenę

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d wastetrack.firma.pl
```

#### 7. Firewall

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS (jeśli SSL)
sudo ufw enable
```

### Opcja 3: Docker (portowalny, do wdrożenia w dowolnej chmurze)

#### `Dockerfile` (już istnieje — Railway używa Nixpacks)

Możesz też zbudować ręcznie:

```bash
# Backend
docker build -t wastetrack-backend -f Dockerfile.backend .
docker run -d -p 4000:4000 --env-file .env.local wastetrack-backend

# Frontend serwowany przez nginx
docker build -t wastetrack-frontend -f Dockerfile.frontend .
docker run -d -p 80:80 wastetrack-frontend
```

#### `Dockerfile.backend`
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/src ./src
COPY backend/tsconfig.json ./
RUN npx tsc
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

#### `Dockerfile.frontend`
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Porównanie metod

| Metoda | Zalety | Wady |
|---|---|---|
| **Lokalny dev** | Najszybszy, pełna kontrola | Tylko jeden deweloper |
| **Firmowa chmura** | Działa 24/7, dostęp z sieci firmowej | Wymaga serwera/VM |
| **Docker** | Portowalny, łatwy scaling | Więcej konfiguracji na starcie |
| **Railway + Vercel** | Zero konfiguracji, https, auto-deploy | Zależność od zewnętrznych serwisów |

## Wymagane porty

| Usługa | Port | Uwagi |
|---|---|---|
| Backend (Express) | 4000 (dev) / 8080 (Railway) | Zmienny przez zmienną PORT |
| Frontend (Vite dev) | 5173 | Tylko do developmentu |
| Frontend (nginx prod) | 80 / 443 | Przez reverse proxy |
| Supabase | — | Zewnętrzna usługa |