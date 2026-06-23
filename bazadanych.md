# 📊 Struktura bazy danych — WasteTrack

Dokumentacja obecnej struktury bazy danych PostgreSQL (Supabase) używanej przez aplikację.

---

## Spis treści

1. [Tabela: `entries`](#1-tabela-entries)
2. [Tabela: `bin_requests`](#2-tabela-bin_requests)
3. [Tabela: `bins`](#3-tabela-bins)
4. [Relacje między tabelami](#4-relacje-między-tabelami)
5. [Pełny skrypt tworzenia bazy](#5-pełny-skrypt-tworzenia-bazy)
6. [Backup i przywracanie](#6-backup-i-przywracanie)

---

## 1. Tabela: `entries`

Główna tabela przechowująca **wpisy odpadów** — każde zdarzenie, gdy operator zgłasza odpad z danej maszyny.

### Definicja

```sql
CREATE TABLE entries (
  id              TEXT PRIMARY KEY,
  date            TEXT NOT NULL,
  time            TEXT NOT NULL,
  "machineId"     TEXT NOT NULL,
  "classificationNumber" TEXT NOT NULL,
  "binNumber"     TEXT NOT NULL,
  reason          TEXT NOT NULL,
  "weightKg"      DOUBLE PRECISION NOT NULL,
  comment         TEXT,
  "createdAt"     TEXT NOT NULL
);
```

### Opis kolumn

| Kolumna | Typ | Opis | Przykład |
|---|---|---|---|
| `id` | TEXT (PK) | Unikalny identyfikator wpisu | `entry-1718093824000-a7b3c` |
| `date` | TEXT | Data zdarzenia (YYYY-MM-DD) | `2026-06-23` |
| `time` | TEXT | Godzina zdarzenia (HH:mm) | `14:30` |
| `machineId` | TEXT | Identyfikator maszyny | `M01`, `M05`, `M11` |
| `classificationNumber` | TEXT | Kod klasyfikacji odpadu | `15 01 05`, `03 03 08` |
| `binNumber` | TEXT | Numer pojemnika | `101`, `0121A`, `27` |
| `reason` | TEXT | Przyczyna (enum) | `awaria`, `blad_operatora`, `procesowy` |
| `weightKg` | DOUBLE PRECISION | Waga w kilogramach | `3.5` |
| `comment` | TEXT | Opcjonalny komentarz | `"uszkodzona forma nr 3"` |
| `createdAt` | TEXT | Timestamp utworzenia (ISO) | `2026-06-23T12:30:00.000Z` |

### Indeksy

Brak dodatkowych indeksów. Dla wydajności polecam dodać:

```sql
CREATE INDEX idx_entries_date ON entries (date);
CREATE INDEX idx_entries_machine ON entries ("machineId");
CREATE INDEX idx_entries_reason ON entries (reason);
```

### Użycie w aplikacji

- `GET /api/entries` — pobiera wszystkie wpisy (posortowane malejąco po `createdAt`)
- `POST /api/entries` — tworzy nowy wpis
- `DELETE /api/entries/:id` — usuwa pojedynczy wpis (admin)
- `DELETE /api/entries?confirm=true` — czyści wszystkie wpisy (admin)

---

## 2. Tabela: `bin_requests`

Przechowuje **zgłoszenia pełnych pojemników** — gdy operator zgłasza, że pojemnik jest pełny i wymaga wymiany.

### Definicja

```sql
CREATE TABLE bin_requests (
  id            TEXT PRIMARY KEY,
  bin_number    TEXT NOT NULL,
  reason        TEXT NOT NULL CHECK (reason IN ('awaria', 'blad_operatora', 'procesowy')),
  requested_by  TEXT NOT NULL,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ,
  resolved_by   TEXT
);
```

### Opis kolumn

| Kolumna | Typ | Opis | Przykład |
|---|---|---|---|
| `id` | TEXT (PK) | Unikalny identyfikator zgłoszenia | `binreq-1718093824000-x9k2m` |
| `bin_number` | TEXT | Numer pojemnika (może być dowolny) | `101`, `0121A` |
| `reason` | TEXT | Przyczyna zgłoszenia (CHECK constraint) | `awaria`, `blad_operatora`, `procesowy` |
| `requested_by` | TEXT | Kto zgłosił (maszyna lub operator) | `M03`, `M08` |
| `requested_at` | TIMESTAMPTZ | Data zgłoszenia (automatyczna) | `2026-06-23 12:30:00+00` |
| `resolved_at` | TIMESTAMPTZ | Data realizacji (NULL = otwarte) | `2026-06-23 14:00:00+00` |
| `resolved_by` | TEXT | Kto zrealizował | `admin` |

### Indeksy

```sql
CREATE INDEX idx_bin_requests_resolved_at ON bin_requests (resolved_at);
```

### Użycie w aplikacji

- `POST /api/bin-requests` — tworzy nowe zgłoszenie
- `GET /api/bin-requests` — lista zgłoszeń (tylko admin)
- `PATCH /api/bin-requests/:id/resolve` — oznacza zgłoszenie jako zrealizowane (admin)

Wyszukiwanie "otwartych" zgłoszeń (oczekujących): `WHERE resolved_at IS NULL`
Wyszukiwanie "zrealizowanych": `WHERE resolved_at IS NOT NULL`

---

## 3. Tabela: `bins`

Słownik **definicji pojemników** — mapa między numerem pojemnika a kodem klasyfikacji odpadu i opisem. Służy do autouzupełniania w formularzu zgłoszenia.

### Definicja

```sql
CREATE TABLE bins (
  id                 TEXT PRIMARY KEY,
  bin_number         TEXT NOT NULL UNIQUE,
  classification_code TEXT NOT NULL,
  description        TEXT NOT NULL DEFAULT '',
  machine_ids        TEXT[] DEFAULT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
```

### Opis kolumn

| Kolumna | Typ | Opis | Przykład |
|---|---|---|---|
| `id` | TEXT (PK) | Unikalny identyfikator | `bin-101` |
| `bin_number` | TEXT (UNIQUE) | Numer pojemnika (unikalny) | `101`, `0121A` |
| `classification_code` | TEXT | Kod klasyfikacji odpadu | `15 01 05`, `03 03 08` |
| `description` | TEXT | Opis zawartości pojemnika | `"Ścinki papieru zalaminowanego"` |
| `machine_ids` | TEXT[] | Lista przypisanych maszyn (NULL = dowolna) | `{M01,M02}` lub `NULL` |
| `created_at` | TIMESTAMPTZ | Data dodania | `2026-06-23 12:00:00+00` |

### Indeksy

```sql
CREATE INDEX idx_bins_bin_number ON bins (bin_number);
```

### Dane przykładowe (z pliku `idpojemnika.md`)

```sql
INSERT INTO bins (id, bin_number, classification_code, description, machine_ids) VALUES
('bin-0121A', '0121A', '15 01 05', 'Ścinki papieru zalaminowanego', NULL),
('bin-26', '26', '15 01 01', 'Pozostałości arkuszy tektury litej (szarej twardej) pod okładki do fotoksiążki', NULL),
('bin-27', '27', '15 01 05', 'Pozostałości arkuszy tektury z gąbką pod okładkę do fotoksiążki', NULL),
('bin-138', '138', '15 01 01', 'Tektura lita - formatki pod okładkę do fotoksiążki', NULL),
('bin-123', '123', '03 03 08', 'Całe bloki z fotoksiążek, pojedyńcze kartki urwane z tych bloków', NULL),
('bin-134', '134', '19 12 01', 'Ścinki papieru z docinania bloków do fotoksiążki', NULL),
('bin-136', '136', '15 01 05', 'Tektura lita lub tektura z gąbką oklejona zadrukowanym, zalaminowanym papierem (cała okładka)', NULL),
('bin-117', '117', '19 12 01', 'Ścinki papieru po wycięciu na gilotynie różne wielkości ścinek', NULL),
('bin-118', '118', '19 12 01', 'Ścinki papieru po wycięciu na gilotynie, różne wielkości ścinek', NULL),
('bin-119', '119', '19 12 01', 'Ścinki papieru po wycięciu na gilotynie, różne wielkości ścinek', NULL),
('bin-89', '89', '03 03 08', 'Całe arkusze papieru zadrukowane', NULL),
('bin-102', '102', '03 03 08', 'Arkusze papieru zadrukowane', NULL),
('bin-027C', '027C', '15 01 01', 'Pozostałości tektury litej z wycinanych formatów', NULL),
('bin-101', '101', '15 01 05', 'Arkusze papieru zalaminowane', NULL),
('bin-25', '25', '15 01 01', 'Tektura lita (szara, twarda) pod okładkę do fotoksiążki', NULL);
```

### Użycie w aplikacji

- `GET /api/bins` — pobiera wszystkie definicje pojemników (używane przez autouzupełnianie w formularzu)

---

## 4. Relacje między tabelami

```
┌──────────────┐          ┌──────────────────┐
│    entries   │          │   bin_requests   │
│──────────────│          │──────────────────│
│ machineId ───┼────?────┼─ requested_by    │
│ binNumber ───┼────?────┼─ bin_number      │
└──────────────┘          └──────────────────┘
       │                         │
       │                         │
       ▼                         ▼
┌─────────────────────────────────────┐
│              bins                   │
│─────────────────────────────────────│
│ bin_number (UNIQUE)                 │
│ classification_code                 │
│ machine_ids (opcjonalnie)           │
└─────────────────────────────────────┘
```

**Uwagi dotyczące relacji:**

- Tabele **nie mają** zdefiniowanych kluczy obcych (foreign keys) — aplikacja zarządza integralnością danych przez kod backendu
- `bins.bin_number` jest UNIQUE i służy do lookupu przez aplikację
- `entries.binNumber` może zawierać numery, które nie istnieją w `bins.bin_number` (jeśli operator wpisał ręcznie nieznany numer)
- `bin_requests.bin_number` analogicznie — może być dowolnym tekstem

---

## 5. Pełny skrypt tworzenia bazy

Poniższy skrypt tworzy wszystkie trzy tabele oraz indeksy. Można uruchomić w SQL Editor w Supabase lub w dowolnym kliencie PostgreSQL.

```sql
-- =====================================================
-- WasteTrack — pełna struktura bazy danych PostgreSQL
-- =====================================================

-- 1. Tabela entries (wpisy odpadów)
CREATE TABLE IF NOT EXISTS entries (
  id                 TEXT PRIMARY KEY,
  date               TEXT NOT NULL,
  time               TEXT NOT NULL,
  "machineId"        TEXT NOT NULL,
  "classificationNumber" TEXT NOT NULL,
  "binNumber"        TEXT NOT NULL,
  reason             TEXT NOT NULL,
  "weightKg"         DOUBLE PRECISION NOT NULL,
  comment            TEXT,
  "createdAt"        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entries_date ON entries (date);
CREATE INDEX IF NOT EXISTS idx_entries_machine ON entries ("machineId");

-- 2. Tabela bin_requests (zgłoszenia pełnych pojemników)
CREATE TABLE IF NOT EXISTS bin_requests (
  id            TEXT PRIMARY KEY,
  bin_number    TEXT NOT NULL,
  reason        TEXT NOT NULL CHECK (reason IN ('awaria', 'blad_operatora', 'procesowy')),
  requested_by  TEXT NOT NULL,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ,
  resolved_by   TEXT
);

CREATE INDEX IF NOT EXISTS idx_bin_requests_resolved_at ON bin_requests (resolved_at);

ALTER TABLE bin_requests DISABLE ROW LEVEL SECURITY;

-- 3. Tabela bins (definicje pojemników)
CREATE TABLE IF NOT EXISTS bins (
  id                 TEXT PRIMARY KEY,
  bin_number         TEXT NOT NULL UNIQUE,
  classification_code TEXT NOT NULL,
  description        TEXT NOT NULL DEFAULT '',
  machine_ids        TEXT[] DEFAULT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bins_bin_number ON bins (bin_number);
```

---

## 6. Backup i przywracanie

### Backup przez Supabase Dashboard

Supabase → Twój projekt → **Database** → **Backups** — codzienne, automatyczne kopie zapasowe.

### Backup ręczny (pg_dump)

Jeśli masz bezpośredni dostęp do bazy:

```bash
# Pobierz connection string z Supabase:
# Project Settings → Database → Connection string (URI)

pg_dump "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" \
  --schema-only \
  --file=bazadanych-schema.sql

# Backup z danymi
pg_dump "postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres" \
  --data-only \
  --table=entries \
  --table=bin_requests \
  --table=bins \
  --file=bazadanych-dane.sql
```

### Przywracanie

```sql
-- 1. Przywróć strukturę
psql "connection-string" < bazadanych-schema.sql

-- 2. Przywróć dane
psql "connection-string" < bazadanych-dane.sql
```

### Backup przez aplikację (admin API)

Można też wyeksportować dane przez REST API (ale tylko dla tabel `entries` i `bin_requests`):

```bash
curl -X GET https://twoj-backend/api/entries \
  -H "Authorization: Bearer <admin-token>" > entries-backup.json

curl -X GET https://twoj-backend/api/bin-requests \
  -H "Authorization: Bearer <admin-token>" > bin-requests-backup.json
```

Tabela `bins` nie ma endpointu do backupu (jest tylko do odczytu), ale jej dane są w pliku `backend/src/scripts/create-bins-table.sql`.

---

## Podsumowanie

| Tabela | Cel | Rozmiar (szac.) | CRUD |
|---|---|---|---|
| `entries` | Wpisy odpadów z maszyn | Największa | API: Create, Read, Delete |
| `bin_requests` | Zgłoszenia pełnych pojemników | Średnia | API: Create, Read, Update (resolve) |
| `bins` | Definicje pojemników | Mała (15 wierszy) | API: Read tylko, dane z pliku SQL |

Wszystkie tabele znajdują się w schemacie `public` bazy Supabase. Backend łączy się przez `service_role_key` (klucz administratora), co omija RLS (Row Level Security) — dlatego RLS jest wyłączone dla `bin_requests`.