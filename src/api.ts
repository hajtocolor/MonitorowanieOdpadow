import { WasteEntry } from './types';
import { getRoleHeader } from './auth';

const API_PREFIX = import.meta.env.VITE_API_URL || '/api';

function buildHeaders(json = true) {
  const headers: Record<string, string> = {
    ...getRoleHeader(),
  };
  if (json) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function handleJsonResponse(response: Response) {
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error || response.statusText || 'Błąd serwera';
    throw new Error(message);
  }
  return response.json();
}

export function getEntries() {
  return fetch(`${API_PREFIX}/entries`, {
    headers: buildHeaders(false),
  }).then(handleJsonResponse) as Promise<WasteEntry[]>;
}

export function createEntry(entry: WasteEntry) {
  return fetch(`${API_PREFIX}/entries`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(entry),
  }).then(handleJsonResponse) as Promise<WasteEntry>;
}

export function deleteEntryApi(id: string) {
  return fetch(`${API_PREFIX}/entries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: buildHeaders(false),
  }).then(response => {
    if (!response.ok) {
      throw new Error('Nie udało się usunąć wpisu');
    }
  });
}

export function clearEntriesApi() {
  return fetch(`${API_PREFIX}/entries`, {
    method: 'DELETE',
    headers: buildHeaders(false),
  }).then(response => {
    if (!response.ok) {
      throw new Error('Nie udało się wyczyścić danych');
    }
  });
}
