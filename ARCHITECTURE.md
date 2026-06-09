# WasteTrack — Architektura i opis projektu

> **WasteTrack** to lekki system webowy do monitorowania i rejestrowania odpadów produkcyjnych w fabryce.  
> Zaprojektowany z założeniem: *minimum tarcia, maksimum użyteczności, zero karania.*

---

## 1. Filozofia projektu

System został stworzony w odpowiedzi na typowe problemy z komercyjnymi systemami ERP do śledzenia odpadów:

- Są drogie (nawet 50 000 zł)
- Są zbyt skomplikowane dla operatorów maszyn
- Generują opór pracowników, gdy są używane do oceny i karania

**Kluczowe założenia psychologiczne:**

| Zasada | Uzasadnienie |
|---|---|
| Brak pola "imię operatora" | System zbiera dane o maszynach, nie o ludziach |
| Nigdy nie karać za dane | Kara → operatorzy wpiszą "awaria maszyny" zamiast prawdziwej przyczyny |
| Maks. 30 sekund na wpis | Wolny system → sabotaż i omijanie |
| Tolerancja wagi ±10% | Celem są duże problemy (3× więcej odpadów), nie liczenie gramów |
| Kolejność: zważ → wyrzuć → wpisz | Gdy odpad jest już w pojemniku, operatorowi obojętna jest waga |

---

## 2. Technologie

| Warstwa | Technologia | Uzasadnienie |
|---|---|---|
| **Frontend** | React 19 + TypeScript | Szybkie tworzenie UI, silne typowanie, ogromny ekosystem |
| **Bundler** | Vite 7 | Błyskawiczny HMR w dev, małe buildy w prod |
| **Stylowanie** | Tailwind CSS 4 | Utility-first, brak narzutu na nazewnictwo klas, mały CSS po tree-shakingu |
| **Store (stan)** | useState + localStorage | Celowo bez Redux/Zustand — prosta aplikacja nie potrzebuje zewnętrznej biblioteki stanu |
| **Wykresy** | Recharts | Lekka biblioteka wykresów dla React, wspiera wykresy słupkowe, liniowe, kołowe, obszarowe |
| **Kody QR** | qrcode | Generowanie kodów QR do szybkiego otwierania rejestru z telefonu |
| **Backend** | Express (Node.js) + TypeScript | Minimalna warstwa API, łatwa w deployu, znana w całym zespole |
| **Baza danych** | Supabase (PostgreSQL) | Gotowe REST API + autentykacja, 0 konfiguracji serwera DB |
| **Formatowanie dat** | date-fns | Lekka alternatywa dla Moment.js, drzewo-shake’owalna, wsparcie dla locale pl |
| **Hosting frontendu** | Vercel | Automatyczny deploy z GitHub, darmowy hosting statyczny, wsparcie dla SPA |
| **Hosting backendu** | Railway / Render | Prosty deploy Node.js, zmienne środowiskowe, darmowe tier |

---

## 3. Architektura systemu

```
┌─────────────────────────────────────────────────────────┐
│                     PRZEGLĄDARKA                        │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Frontend (React + Vite)                         │   │
│  │                                                  │   │
│  │  App.tsx (router, logowanie, layout)             │   │
│  │      │                                           │   │
│  │      ├── RegisterTab     📝 Rejestr              │   │
│  │      ├── DashboardTab    📊 Dashboard            │   │
│  │      ├── ReasonAnalysisTab 🤖 Przyczyny          │   │
│  │      ├── MachineAnalysisTab ⚙️ Maszyny           │   │
│  │      ├── HistoryTab      📋 Historia             │   │
│  │      ├── QRTab           🚀 QR Faza 2            │   │
│  │      ├── RulesTab        📜 Zasady               │   │
│  │      └── DictionaryTab   📖 Słownik              │   │
│  │                                                  │   │
│  │  ┌─────────────┐  ┌──────────────────┐           │   │
│  │  │ store.ts    │  │ api.ts           │           │   │
│  │  │ (lokalne d. │  │ (klient HTTP)    │           │   │
│  │  │ + sync)     │  └────────┬─────────┘           │   │
│  │  └─────────────┘           │                     │   │
│  └────────────────────────────┼─────────────────────┘   │
│                               │ HTTP (fetch)            │
└───────────────────────────────┼─────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            dev: localhost:4000    prod: railway.app
                    │                       │
                    ▼                       ▼
          ┌─────────────────────────────────────┐
          │  Backend (Express + TypeScript)      │
          │                                      │
          │  POST /api/entries   → CREATE        │
          │  GET  /api/entries   → READ          │
          │  DELETE /api/entries/:id → DELETE    │
          │  DELETE /api/entries → CLEAR ALL     │
          │  POST /api/login     → AUTH          │
          │  GET  /api/health    → HEALTH CHECK  │
          │                                      │
          └────────────────┬────────────────────┘
                           │
                           ▼
              ┌─────────────────────┐
              │  Supabase           │
              │  (PostgreSQL)       │
              │                     │
              │  table: entries     │
              └─────────────────────┘
```

### 3.1 Tryb offline-first

Gdy backend jest niedostępny, aplikacja działa w pełni lokalnie:

1. Przy starcie frontend próbuje połączyć się z backendem
2. Jeśli backend nie odpowiada → dane są przechowywane wyłącznie w `localStorage`
3. Wszystkie operacje (CRUD) działają lokalnie
4. Gdy backend wróci online → frontend przełącza się automatycznie na synchronizację

To oznacza, że **awaria serwera nie zatrzymuje produkcji**.

---

## 4. Model danych

### WasteEntry (główna encja)

```typescript
interface WasteEntry {
  id: string;                // np. "entry-1712345678900-abc123"
  date: string;              // YYYY-MM-DD
  time: string;              // HH:MM
  machineId: string;         // M01–M11 (referencja do tablicy MACHINES)
  classificationNumber: string; // kod odpadu np. "15 01 01"
  binNumber: string;         // numer pojemnika
  reason: 'awaria' | 'blad_operatora' | 'procesowy';
  weightKg: number;          // waga w kilogramach (±10% tolerancji)
  comment?: string;          // opcjonalny komentarz
  createdAt: string;         // ISO timestamp pełny
}
```

### Machine (słownik maszyn)

```typescript
interface Machine {
  id: string;   // M01..M11
  label: string; // wyświetlana nazwa
}
```

Aktualne maszyny:

| ID | Nazwa |
|---|---|
| M01 | HD 1 (HP100K) |
| M02 | HD 2 (HP100K) |
| M03 | HD 3 (HP100K) |
| M04 | HD 4 (HP100K) |
| M05 | HM 1 |
| M06 | HM 2 |
| M07 | NORITSU |
| M08 | VSP |
| M09 | MASTER CUT 1 |
| M10 | MASTER CUT 2 |
| M11 | MASTER CUT 3 |

### Powody odpadu (3 kategorie)

| reason | Etykieta | Kolor |
|---|---|---|
| `awaria` | Awaria maszyny | Czerwony |
| `blad_operatora` | Błąd operatora | Żółty |
| `procesowy` | Normalny odpad procesowy | Szary |

---

## 5. System ról

| Rola | Zakładki | Może dodawać | Może usuwać | Może czyścić |
|---|---|---|---|---|
| **worker** | Tylko Rejestr | ✅ | ❌ | ❌ |
| **admin** | Wszystkie (9 zakładek) | ✅ | ✅ | ✅ |

### Autoryzacja przez JWT

Logowanie odbywa się przez endpoint `POST /api/login`:

1. Frontend wysyła `{ role, password }`
2. Backend weryfikuje hasło z zmienną środowiskową (`ADMIN_PASSWORD` / `WORKER_PASSWORD`)
3. Po weryfikacji backend zwraca **token JWT** (`jsonwebtoken`, expiry 24h)
4. Frontend przechowuje token i wysyła go w nagłówku `Authorization: Bearer <token>` przy każdym zapytaniu
5. Middleware `authenticateToken` weryfikuje token przed udostępnieniem chronionych endpointów
6. Middleware `requireRole` dodatkowo sprawdza, czy użytkownik ma odpowiednią rolę (np. tylko admin może usuwać wpisy)

**Kluczowe zmienne środowiskowe:**
- `JWT_SECRET` — tajny klucz do podpisywania tokenów
- `ADMIN_PASSWORD` — hasło administratora (przechowywane tylko na backendzie)
- `WORKER_PASSWORD` — hasło pracownika (przechowywane tylko na backendzie)

---

## 6. Funkcjonalności szczegółowo

### 📝 Rejestr (RegisterTab)
- Formularz: wybór maszyny, data, godzina, kod odpadu, numer pojemnika, przyczyna, waga
- Walidacja po stronie klienta
- Automatyczny zapis do backendu (z fallbackiem do localStorage)

### 📊 Dashboard (DashboardTab)
- Wykres słupkowy: kg odpadów na maszynę (bieżący dzień)
- Wykres kołowy: podział według przyczyn
- Wykres liniowy: trendy 7-dniowe
- Statystyki: łączna waga, liczba wpisów, dominująca przyczyna

### 🤖 Analiza – Przyczyny (ReasonAnalysisTab)
- Ranking przyczyn odpadów
- Wykres słupkowy dla każdej przyczyny z podziałem na maszyny
- Identyfikacja dominującego problemu

### ⚙️ Analiza – Maszyny (MachineAnalysisTab)
- Ranking maszyn według kg odpadów
- Kliknięcie maszyny → szczegółowy wykres 7-dniowy
- Identyfikacja maszyn generujących najwięcej odpadów

### 📋 Historia (HistoryTab)
- Pełna lista wpisów z paginacją
- Filtrowanie: data, maszyna, przyczyna
- Eksport do CSV (kompatybilny z Excel)

### 🚀 QR Faza 2 (QRTab)
- Instrukcja wdrożenia kodów QR
- Generowanie kodu QR do szybkiego dostępu do rejestru z telefonu

### 📜 Zasady (RulesTab)
- Złota zasada systemu
- Zasady bez których system na pewno zawiedzie
- Proces dla operatora (4 kroki)
- Konfiguracja fizyczna pojemników
- Opis zakładek systemu

### 📖 Słownik (DictionaryTab)
- Definicja klasyfikacji odpadów (odpad technologiczny vs. wynikający z błędu)
- Tabela 1: 63 kodów odpadów z nazwami
- Tabela 2: 63 kodów odpadów z nazwami i szczegółowymi opisami

---

## 7. Hostowanie i deploy

### Frontend → Vercel

- Repozytorium GitHub podłączone do Vercel
- Automatyczny deploy przy każdym pushu do main
- Konfiguracja w `vercel.json` (SPA rewrites)
- Zmienna środowiskowa: `VITE_API_URL` → URL backendu

### Backend → Railway

- Root directory: `backend/`
- Railway wykrywa `package.json`, uruchamia `npm install` → `npm run build` → `npm start`
- Zmienne środowiskowe: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`

### Baza danych → Supabase

- PostgreSQL w chmurze
- Tabela `entries` z kolumnami odpowiadającymi `WasteEntry`
- Service role key do autoryzacji backendu

---

## 8. Bezpieczeństwo — wdrożone zabezpieczenia

| Mechanizm | Status | Implementacja |
|---|---|---|
| **Autoryzacja JWT** | ✅ Wdrożone | `jsonwebtoken`, token 24h, middleware `authenticateToken` i `requireRole` |
| **Hasła w env** | ✅ Wdrożone | `ADMIN_PASSWORD`, `WORKER_PASSWORD`, `JWT_SECRET` — tylko w zmiennych środowiskowych Railwaya |
| **Rate limiting** | ✅ Wdrożone | `express-rate-limit`, max 100 requestów/minutę |
| **Walidacja payloadu** | ✅ Wdrożone | Funkcja `validateEntry` — sprawdza typy i wymagane pola przed zapisem |
| **Helmet (nagłówki security)** | ✅ Wdrożone | `helmet` z CSP wyłączonym dla SPA |
| **CORS** | ✅ Wdrożone | Ograniczone do originu z `CORS_ORIGIN` (lub `*` w dev) |
| **HTTPS** | ✅ Wdrożone | Vercel i Railway domyślnie wymuszają HTTPS na produkcji |
| **Limit rozmiaru JSON** | ✅ Wdrożone | `express.json({ limit: '1mb' })` |

### Uwagi i dalsze usprawnienia

- **Tryb dev**: w `src/auth.ts` istnieje pomocnicza funkcja logowania bez backendu (do testów lokalnych) — nie wpływa na produkcję
- **CSRF**: przy architekturze SPA + Bearer token CSRF nie jest wymagany, ale można dodać dla dodatkowego bezpieczeństwa
- **Brak autoryzacji na poziomie Supabase**: backend używa `service_role key`, który ma pełny dostęp — autoryzacja odbywa się wyłącznie w warstwie Express

---

## 9. Podsumowanie

WasteTrack rozwiązuje realny problem fabryki:

1. **Jest tani** — 0 zł za licencje, tylko koszt hostingu (Vercel + Railway + Supabase to darmowe tier)
2. **Jest szybki** — maks. 30 sekund na wpis, brak zbędnych pól
3. **Jest bezpieczny psychologicznie** — nie karze, nie ocenia, nie zawiera imion operatorów
4. **Jest odporny na awarie** — offline-first, dane w localStorage gdy backend nie odpowiada
5. **Jest rozszerzalny** — prosta architektura, łatwo dodać nowe funkcje

---

*Ostatnia aktualizacja: czerwiec 2026*