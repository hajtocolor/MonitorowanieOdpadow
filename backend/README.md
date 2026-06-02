# WasteTrack Backend

Backend oferuje REST API dla tabeli wpisów odpadów.

Dla działania kontroli dostępu żądania przyjmują nagłówek `X-User-Role: admin|worker`.

Dostępne konta:
- Administrator: `admin` / `admin123`
- Pracownik: `worker` / `worker123`

API logowania:
- `POST /api/login` z JSON `{ role, password }`

## Konfiguracja Supabase

Backend używa Supabase jako źródła danych. Aby uruchomić serwer, ustaw:

- `SUPABASE_URL` albo `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Backend próbuje załadować zmienne z `backend/.env` i z root `./.env.local`.

Tabela `entries` powinna istnieć w projekcie Supabase z kolumnami:
`id`, `date`, `time`, `machineId`, `reason`, `weightKg`, `comment`, `createdAt`.

## Uruchomienie

1. Otwórz terminal w `backend`.
2. Uruchom `npm install`.
3. Następnie `npm run dev`.

Backend będzie dostępny pod `http://localhost:4000`.

## Migration SQLite -> Supabase

Jeżeli masz jeszcze lokalny plik SQLite z tabelą `entries`, możesz go przenieść do Supabase za pomocą skryptu.
Zamień `./path/to/waste.db` na rzeczywistą ścieżkę do Twojego pliku SQLite:

```bash
cd backend
npm run migrate:sqlite -- ./backend/data/waste.db
```

Jeżeli plik znajduje się dokładnie w `backend/data/waste.db`, możesz uruchomić:

```bash
cd backend
npm run migrate:sqlite
```

Skrypt czyta wszystkie wpisy z tabeli `entries` i wgrywa je do tabeli `entries` w Supabase, używając `upsert` po polu `id`.

## API

- `GET /api/entries`
- `POST /api/entries`
- `DELETE /api/entries/:id`
- `DELETE /api/entries`
- `GET /api/health`
