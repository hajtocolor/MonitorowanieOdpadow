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

  // Ładuje dane z backendu (wspólna funkcja do wielokrotnego użycia)
  const refreshEntries = useCallback(() => {
    getEntries()
      .then(remoteEntries => {
        setEntries(remoteEntries.map(normalizeEntry));
        setBackendAvailable(true);
      })
      .catch(() => {
        // Jeśli backend był wcześniej dostępny, a teraz nie – zachowaj ostatnie dane
        setBackendAvailable(prev => prev === null ? false : prev);
      });
  }, []);

  useEffect(() => {
    refreshEntries();
  }, [refreshEntries]);

  // Polling co 15 sekund – synchronizacja między kartami
  useEffect(() => {
    const interval = setInterval(() => {
      getEntries()
        .then(remoteEntries => {
          setEntries(remoteEntries.map(normalizeEntry));
          setBackendAvailable(true);
        })
        .catch(() => {
          // ignoruj błędy pollingu – ciche odświeżanie
        });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Odśwież przy powrocie do karty (np. przełączenie między zakładkami)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshEntries();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshEntries]);

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
