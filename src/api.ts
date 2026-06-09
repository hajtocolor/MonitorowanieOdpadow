import { WasteEntry } from './types';
import { getAuthHeaders } from './auth';

const API_PREFIX = import.meta.env.VITE_API_URL || '/api';

function buildHeaders(json = true) {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
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
  return fetch(`${API_PREFIX}/entries?confirm=true`, {
    method: 'DELETE',
    headers: buildHeaders(false),
  }).then(response => {
    if (!response.ok) {
      throw new Error('Nie udało się wyczyścić danych');
    }
  });
}

// === BIN REQUESTS ===

export interface BinRequestPayload {
  binNumber: string;
  reason: string;
  requestedBy: string;
}

export function createBinRequest(payload: BinRequestPayload) {
  return fetch(`${API_PREFIX}/bin-requests`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  }).then(handleJsonResponse);
}

export function getBinRequests() {
  return fetch(`${API_PREFIX}/bin-requests`, {
    headers: buildHeaders(false),
  }).then(handleJsonResponse);
}

export function resolveBinRequest(id: string) {
  return fetch(`${API_PREFIX}/bin-requests/${encodeURIComponent(id)}/resolve`, {
    method: 'PATCH',
    headers: buildHeaders(false),
  }).then(async response => {
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || 'Nie udało się oznaczyć zgłoszenia jako zrealizowane');
    }
    return response.json();
  });
}
