# Dodawanie nowego pracownika i nadawanie dostępu (szybka metoda dev)

> Uwaga: to instrukcja dla obecnej, prostszej implementacji, w której hasła/role są trzymane w kodzie. Dla produkcji należy zrealizować system użytkowników z bazą i hashowaniem haseł.

## Szybki sposób (edytuj pliki źródłowe)
Aby dodać nowego pracownika (np. `worker2` z hasłem `secret123`), wykonaj poniższe kroki:

1. Edytuj `src/auth.ts` (frontend):

- Otwórz `src/auth.ts` i znajdź tablicę `CREDENTIALS`.
- Dodaj wpis:

```ts
const CREDENTIALS: Record<UserRole, string> = {
  admin: 'admin123',
  worker: 'worker123',
  // dodaj tymczasowo dodatkowe konto jeśli chcesz rozróżniać
};
```

> Aktualny frontend trzyma tylko dwie role `admin` i `worker`. Jeśli chcesz mieć wiele kont typy `worker`, najlepiej zmienić implementację na bazę użytkowników. Poniżej podstawowe wskazówki jak to zrobić.

2. Edytuj `backend/src/server.ts` (backend):

- Znajdź `CREDENTIALS` i dopisz nowe konto (tylko do szybkich testów):

```js
const CREDENTIALS: Record<'admin' | 'worker', string> = {
  admin: 'admin123',
  worker: 'worker123',
  // nie zalecane: wiele workerów w tej strukturze
};
```

3. Restartuj backend i frontend:

```bash
# backend
cd backend
npm install
npm run dev

# frontend (w katalogu głównym projektu)
npm run dev
```

4. Logowanie
- W UI wybierz rolę `Pracownik` i użyj odpowiedniego hasła.

## Rekomendowane podejście produkcyjne
Zalecam implementację rzeczywistego systemu użytkowników:

- Dodaj tabelę `users` w bazie (np. PostgreSQL lub nawet SQLite):
  - `id`, `username`, `password_hash`, `role`, `createdAt`
- Hashuj hasła (np. bcrypt) i twórz tokeny JWT lub sesje zarządzane po stronie serwera.
- Stwórz endpointy:
  - `POST /api/auth/register` (tylko admin może tworzyć użytkowników)
  - `POST /api/auth/login` — zwraca token
  - `GET /api/users` — lista użytkowników (admin)
  - `PUT /api/users/:id` — zmień rolę / zresetuj hasło (admin)
- Zaimplementuj middleware, które autoryzuje token JWT i ustawia rolę użytkownika w request (zamiast nagłówka `X-User-Role`).

## Jak nadać konkretnie dostęp "pracownikowi"
1. W modelu produkcyjnym ustaw `role = 'worker'` i utwórz rekord w tabeli users.
2. Pracownik po zalogowaniu otrzymuje token; frontend przechowuje token w cookie lub localStorage i przesyła go w `Authorization: Bearer <token>`.
3. Backend weryfikuje token i pozwala na dodawanie wpisów, ale blokuje usuwanie (sprawdza `role`).

## Szybka lista zadań dla dewelopera, żeby zamienić obecną prostą metodę na produkcyjną
- [ ] Dodać tabelę `users` i endpointy auth
- [ ] Użyć `bcrypt` do haszowania haseł
- [ ] Użyć `jsonwebtoken` (JWT) do generowania tokenów lub session store
- [ ] Aktualizować frontend, aby logować przez endpoint `POST /api/auth/login` i przechowywać token
- [ ] Zastąpić przesyłanie nagłówka `X-User-Role` w `src/api.ts` przez `Authorization: Bearer ...`

