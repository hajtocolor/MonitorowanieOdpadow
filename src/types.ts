export type WasteReason = 'awaria' | 'blad_operatora' | 'procesowy';

export interface WasteEntry {
  id: string;
  date: string;       // ISO date string YYYY-MM-DD
  time: string;       // HH:MM
  machineId: string;
  reason: WasteReason;
  weightKg: number;
  comment?: string;
  createdAt: string;  // full ISO timestamp
}

export interface Machine {
  id: string;
  label: string;
}

export type UserRole = 'admin' | 'worker';

export const MACHINES: Machine[] = [
  { id: 'M01', label: 'M01 – Prasa hydrauliczna' },
  { id: 'M02', label: 'M02 – Wtryskarka #1' },
  { id: 'M03', label: 'M03 – Wtryskarka #2' },
  { id: 'M04', label: 'M04 – Linia spawalnicza' },
  { id: 'M05', label: 'M05 – CNC frezarka' },
  { id: 'M06', label: 'M06 – Tokarka automatyczna' },
  { id: 'M07', label: 'M07 – Linia pakowania' },
  { id: 'M08', label: 'M08 – Agregat chłodniczy' },
  { id: 'M09', label: 'M09 – Robot spawalniczy' },
  { id: 'M10', label: 'M10 – Taśma transportowa' },
];

export const REASONS: Record<WasteReason, { label: string; color: string; bg: string; border: string; emoji: string; binColor: string }> = {
  awaria: {
    label: 'Awaria maszyny',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-300',
    emoji: '🟥',
    binColor: 'bg-red-500',
  },
  blad_operatora: {
    label: 'Błąd operatora',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    emoji: '🟨',
    binColor: 'bg-yellow-400',
  },
  procesowy: {
    label: 'Normalny odpad procesowy',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    emoji: '⬜',
    binColor: 'bg-gray-200',
  },
};

export const STORAGE_KEY = 'wastetrack_entries_v1';
