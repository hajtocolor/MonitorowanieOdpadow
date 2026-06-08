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
    if (!raw) return generateSampleData();
    return (JSON.parse(raw) as any[]).map(normalizeEntry);
  } catch {
    return generateSampleData();
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

function generateSampleData(): WasteEntry[] {
  const entries: WasteEntry[] = [];
  const now = new Date();
  const reasons: Array<'awaria' | 'blad_operatora' | 'procesowy'> = ['awaria', 'blad_operatora', 'procesowy'];
  const machines = ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07'];
  const comments: Record<string, string[]> = {
    awaria: ['Uszkodzona uszczelka', 'Awaria siłownika', 'Zacięcie mechanizmu', 'Przegrzanie silnika', ''],
    blad_operatora: ['Błędne ustawienie parametrów', 'Nieodpowiedni surowiec', 'Pomylona forma', ''],
    procesowy: ['Rozruch zmiany', 'Zmiana serii', 'Calibracja', ''],
  };

  for (let d = 29; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    const count = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < count; i++) {
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      const machine = machines[Math.floor(Math.random() * machines.length)];
      const hour = Math.floor(Math.random() * 14) + 6;
      const minute = Math.floor(Math.random() * 60);
      const timeStr = `${pad(hour)}:${pad(minute)}`;
      const weight = randomBetween(0.5, 18);
      const commentList = comments[reason];
      const comment = commentList[Math.floor(Math.random() * commentList.length)];

      entries.push({
        id: `sample-${d}-${i}`,
        date: dateStr,
        time: timeStr,
        machineId: machine,
        classificationNumber: [`12.01.01`, `17.03.04`, `18.02.05`, `20.01.02`][Math.floor(Math.random() * 4)],
        binNumber: String(Math.floor(Math.random() * 5) + 1),
        reason,
        weightKg: weight,
        comment: comment || undefined,
        createdAt: `${dateStr}T${timeStr}:00.000Z`,
      });
    }
  }

  return entries;
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
