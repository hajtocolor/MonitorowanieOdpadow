import { WasteEntry, Bin } from './types';
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

function mapBinRequest(raw: any): any {
  return {
    id: raw.id,
    binNumber: raw.bin_number ?? raw.binNumber ?? '',
    reason: raw.reason,
    requestedBy: raw.requested_by ?? raw.requestedBy,
    requestedAt: raw.requested_at ?? raw.requestedAt,
    resolvedAt: raw.resolved_at ?? raw.resolvedAt ?? null,
    resolvedBy: raw.resolved_by ?? raw.resolvedBy ?? null,
  };
}

export function createBinRequest(payload: BinRequestPayload) {
  return fetch(`${API_PREFIX}/bin-requests`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  }).then(handleJsonResponse).then(mapBinRequest);
}

export function getBinRequests() {
  return fetch(`${API_PREFIX}/bin-requests`, {
    headers: buildHeaders(false),
  }).then(handleJsonResponse).then((data: any[]) => (data ?? []).map(mapBinRequest));
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
    return response.json().then(mapBinRequest);
  });
}

// === BINS (autocomplete + admin) ===

export function getBins() {
  return fetch(`${API_PREFIX}/bins`, {
    headers: buildHeaders(false),
  }).then(handleJsonResponse).then((data: any[]) => (data ?? []).map((b: any) => ({
    id: b.id,
    binNumber: b.bin_number ?? b.binNumber ?? '',
    classificationCode: b.classification_code ?? b.classificationCode,
    description: b.description ?? '',
    areaIds: b.area_ids ?? b.areaIds ?? null,
  }))) as Promise<Bin[]>;
}

export function createBin(data: { binNumber: string; classificationCode: string; description?: string; areaIds?: string[] }) {
  return fetch(`${API_PREFIX}/bins`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(data),
  }).then(handleJsonResponse).then((b: any) => ({
    id: b.id,
    binNumber: b.bin_number ?? b.binNumber ?? '',
    classificationCode: b.classification_code ?? b.classificationCode,
    description: b.description ?? '',
    areaIds: b.area_ids ?? b.areaIds ?? null,
  }));
}

export function deleteBin(id: string) {
  return fetch(`${API_PREFIX}/bins/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: buildHeaders(false),
  }).then(response => {
    if (!response.ok) throw new Error('Nie udało się usunąć pojemnika');
  });
}

// === AREAS (dawniej MACHINES) ===

export function getAreas(): Promise<{ id: string; label: string }[]> {
  return fetch(`${API_PREFIX}/areas`, {
    headers: buildHeaders(false),
  }).then(handleJsonResponse);
}

export function createArea(data: { id: string; label: string }) {
  return fetch(`${API_PREFIX}/areas`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(data),
  }).then(handleJsonResponse);
}

export function deleteArea(id: string) {
  return fetch(`${API_PREFIX}/areas/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: buildHeaders(false),
  }).then(response => {
    if (!response.ok) throw new Error('Nie udało się usunąć obszaru');
  });
}