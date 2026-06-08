import { useState, useEffect, useCallback } from 'react';
import { WasteEntry, STORAGE_KEY } from './types';
import { getEntries, createEntry, deleteEntryApi, clearEntriesApi } from './api';

function normalizeEntry(entry: any): WasteEntry {
  return {
    ...entry,
    classificationNumber: entry.classificationNumber ?? '',
    binNumber: entry.binNumber ?? '',
  } as WasteEntry;
}

function loadEntries(): WasteEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as any[]).map(normalizeEntry);
  } catch {
    return [];
  }
}

function saveEntries(entries: WasteEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function randomBetween(a: number, b: number): number {
  return Math.round((Math.random() * (b - a) + a) * 10) / 10;
}


function makeEntry(entry: Omit<WasteEntry, 'id' | 'createdAt'>): WasteEntry {
  const now = new Date();
  return {
    ...entry,
    id: `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: now.toISOString(),
  };
}

export function useWasteStore() {
  const [entries, setEntries] = useState<WasteEntry[]>(() => loadEntries());
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    getEntries()
      .then(remoteEntries => {
        setEntries(remoteEntries.map(normalizeEntry));
        setBackendAvailable(true);
      })
      .catch(() => {
        setBackendAvailable(false);
      });
  }, []);

  useEffect(() => {
    if (backendAvailable === false) {
      saveEntries(entries);
    }
  }, [entries, backendAvailable]);

  const addEntry = useCallback((entry: Omit<WasteEntry, 'id' | 'createdAt'>) => {
    const newEntry = makeEntry(entry);
    setEntries(prev => [newEntry, ...prev]);

    if (backendAvailable !== false) {
      createEntry(newEntry).catch(() => setBackendAvailable(false));
    }

    return newEntry;
  }, [backendAvailable]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));

    if (backendAvailable !== false) {
      deleteEntryApi(id).catch(() => setBackendAvailable(false));
    }
  }, [backendAvailable]);

  const clearAll = useCallback(() => {
    setEntries([]);

    if (backendAvailable !== false) {
      clearEntriesApi().catch(() => setBackendAvailable(false));
    }
  }, [backendAvailable]);

  return { entries, addEntry, deleteEntry, clearAll };
}
