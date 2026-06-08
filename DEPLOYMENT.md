# Deployment & Hosting — WasteTrack

Ten dokument opisuje, jak wdrożyć aplikację WasteTrack na frontend (Vercel) i backend (Railway/Render).

## Architektura

- **Frontend** — React + Vite, hostowany na **Vercel** (statyczny hosting)
- **Backend** — Express, hostowany na **Railway** lub **Render** (jako stały proces Node.js)
- **Baza danych** — **Supabase** (bez zmian)

## Wymagania

- Konto na [Vercel](https://vercel.com)
- Konto na [Railway](https://railway.app) lub [Render](https://render.com)
- Konto [Supabase](https://supabase.com) z projektem i tabelą `entries`

---

## 1. Frontend — Vercel

### Konfiguracja

Projekt ma już plik `vercel.json` z przekierowaniem SPA:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deploy na Vercel

1. Wejdź na [vercel.com](https://vercel.com) i kliknij **Add New → Project**
2. Zaimportuj repozytorium GitHub
3. Ustaw:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. W zmiennych środowiskowych (Environment Variables) dodaj:
   - `VITE_API_URL` — URL backendu (np. `https://twoj-backend.railway.app/api`)
5. Kliknij **Deploy**

> **Uwaga**: Zmienna `VITE_API_URL` w dev nie jest potrzebna — frontend używa proxy Vite (`localhost:4000`). W produkcji zastąp ją URL-em backendu.

### Routing SPA

`vercel.json` zapewnia, że wszystkie ścieżki (np. `/dashboard`) trafiają do `index.html` — React Router obsługuje routing po stronie klienta.

---

## 2. Backend — Railway

### Wymagane zmienne środowiskowe

Ustaw w panelu Railway:

| Zmienna | Opis |
|---|---|
| `SUPABASE_URL` | URL projektu Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Klucz service_role z Supabase |
| `CORS_ORIGIN` | URL frontendu z Vercel (np. `https://moj-projekt.vercel.app`) |
| `PORT` | Port (Railway ustawia automatycznie) |

### Deploy na Railway

1. Wejdź na [railway.app](https://railway.app) → **New Project**
2. Wybierz **Deploy from GitHub repo**
3. Wybierz repozytorium, a następnie ustaw **Root Directory** na `backend`
4. Railway automatycznie wykryje `package.json` i uruchomi:
   - `npm install` → `postinstall` → `npm run build`
   - `npm start` → `node dist/server.js`
5. Dodaj zmienne środowiskowe (sekcja Variables)
6. Kliknij **Deploy**

### Deploy na Render (alternatywa)

1. Wejdź na [render.com](https://render.com) → **New Web Service**
2. Połącz repozytorium GitHub
3. Ustaw:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Dodaj zmienne środowiskowe
5. Kliknij **Create Web Service**

---

## 3. Backend — CORS

Backend ma skonfigurowany CORS:

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
```

W produkcji ustaw `CORS_ORIGIN` na URL frontendu z Vercel (np. `https://moj-projekt.vercel.app`). W dev CORS pozwala na wszystkie originy (`*`).

---

## 4. Zmienne środowiskowe — podsumowanie

### Frontend (Vercel)

| Zmienna | Wartość |
|---|---|
| `VITE_API_URL` | `https://twoj-backend.railway.app/api` |

### Backend (Railway/Render)

| Zmienna | Wartość |
|---|---|
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role key) |
| `CORS_ORIGIN` | `https://moj-projekt.vercel.app` |
| `PORT` | (automatycznie) |

---

## 5. Uruchomienie lokalne

```bash
# 1. Backend (terminal 1)
cd backend
npm install
npm run dev

# 2. Frontend (terminal 2)
npm install
npm run dev
```

Frontend będzie dostępny na `http://localhost:5173`, backend na `http://localhost:4000`.

---

## 6. Struktura projektu po zmianach

```
factory-waste-tracking-system/
├── vercel.json            # ← nowy: konfiguracja Vercel
├── vite.config.ts         # base: '/' (zmienione)
├── package.json           # usunięte skrypty GitHub Pages
├── tsconfig.json          # dodane vite/client
├── src/
│   └── api.ts             # dynamiczny API URL z VITE_API_URL
├── backend/
│   ├── package.json       # dodany postinstall
│   └── src/server.ts      # CORS z CORS_ORIGIN
└── DEPLOYMENT.md          # ta dokumentacja
```

---

## Szybki checklist

### Frontend (Vercel)
- [ ] Zaimportuj repozytorium do Vercel
- [ ] Ustaw `VITE_API_URL` w zmiennych środowiskowych
- [ ] Deploy

### Backend (Railway/Render)
- [ ] Utwórz nowy projekt Railway/Render
- [ ] Ustaw root directory na `backend`
- [ ] Dodaj zmienne: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`
- [ ] Deploy

### Po deployu
- [ ] Sprawdź endpoint `/api/health` backendu
- [ ] Przetestuj działanie frontendu (dodawanie/usuwanie wpisów)
- [ ] Sprawdź czy CORS działa poprawnie