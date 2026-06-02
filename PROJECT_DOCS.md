# WasteTrack — Dokumentacja projektu

## Krótkie wprowadzenie
WasteTrack to lekka aplikacja webowa do rejestrowania odpadów produkcyjnych. Składa się z:

- Frontendu (React + Vite + TypeScript + Tailwind) — folder `src/`
- Backend (Express + Supabase) — folder `backend/`

Aplikacja wspiera role użytkowników: `admin` (pełny dostęp) i `worker` (tylko rejestr).

## Struktura repozytorium (najważniejsze pliki)
- `index.html` — wejściowy plik frontendu
- `package.json` — skrypty i zależności frontendu
- `vite.config.ts` — konfiguracja deweloperska (proxy `/api` -> `http://localhost:4000`)
- `src/` — kod frontendu
  - `src/App.tsx` — główna aplikacja i logowanie ról
  - `src/store.ts` — lokalny store + synchronizacja z backendem
  - `src/api.ts` — klient do API
  - `src/auth.ts` — proste zarządzanie rolami i hasłami (dev)
- `backend/` — serwer Express + Supabase
  - `backend/src/server.ts` — główny serwer i API
  - `backend/README.md` — krótkie informacje o backendzie

## Funkcjonalności
- Dodawanie wpisów o odpadach (data, godzina, maszyna, przyczyna, waga, komentarz)
- Filtrowanie oraz eksport CSV (frontend)
- Dashboard z wykresami (frontend)
- Role: `admin` (może usuwać wpisy, czyścić bazę i widzi wszystkie zakładki) oraz `worker` (może tylko dodawać wpisy i widzi wyłącznie zakładkę Rejestr)

## Uruchamianie lokalnie (dewelopersko)
1. Zainstaluj zależności frontendu:

```powershell
cd c:\Users\trokoszynski\Desktop\factory-waste-tracking-system
npm install
```

2. Uruchom frontend (Vite):

```powershell
npm run dev
```

3. Uruchom backend (w oddzielnym terminalu):

```powershell
cd backend
npm install
npm run dev
```

Frontend jest skonfigurowany tak, by w trybie deweloperskim proxy'ował `/api` do `http://localhost:4000`.

## API (szybkie podsumowanie)
- `GET /api/entries` — pobierz wszystkie wpisy (posortowane malejąco po `createdAt`)
- `POST /api/entries` — dodaj wpis (treść JSON: pełen obiekt `WasteEntry`)
- `DELETE /api/entries/:id` — usuń wpis (wymagane `X-User-Role: admin`)
- `DELETE /api/entries` — wyczyść wszystkie wpisy (wymagane `X-User-Role: admin`)
- `POST /api/login` — (opcjonalne) w prostym trybie dev sprawdzenie hasła: `{ role, password }`

Nagłówek `X-User-Role: admin|worker` jest używany przez backend do autoryzacji chronionych operacji.

## Bezpieczeństwo i uwagi
- W obecnej implementacji hasła są trzymane jawnie (w `src/auth.ts` i w `backend/src/server.ts`) tylko dla szybkiego testowania. PRZY WDROŻENIU NA PRODUKCJĘ należy zastąpić to bezpiecznym mechanizmem (DB użytkowników, hashowanie haseł, JWT lub sesje, HTTPS).
- Zmień domyślne hasła przed przekazaniem systemu produkcyjnego.
- Supabase jest domyślną bazą danych w tym repozytorium, co eliminuje lokalny plik SQLite i upraszcza wdrożenie.

## Gdzie szukać dalszych zmian
- Zmiana domyślnych ról/ haseł: `src/auth.ts` i `backend/src/server.ts`
- Zmiana zachowania synchronizacji frontendu z backendem: `src/store.ts` i `src/api.ts`

---
Pliki z dokumentacją wdrożeniową i dodawania użytkowników znajdziesz w repozytorium:
- `DEPLOYMENT.md`
- `ADD_USER.md`
