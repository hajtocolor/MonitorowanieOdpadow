export type WasteReason = 'awaria' | 'blad_operatora' | 'procesowy';

export interface WasteEntry {
  id: string;
  date: string;       // ISO date string YYYY-MM-DD
  time: string;       // HH:MM
  machineId: string;
  classificationNumber: string;
  binNumber: string;
  reason: WasteReason;
  weightKg: number;
  comment?: string;
  createdAt: string;  // full ISO timestamp
}

export interface BinRequest {
  id: string;
  binNumber: string;
  reason: WasteReason;
  requestedBy: string;
  requestedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface Machine {
  id: string;
  label: string;
}

export type UserRole = 'admin' | 'worker';

export const MACHINES: Machine[] = [
  { id: 'M01', label: 'HD 1 (HP100K)' },
  { id: 'M02', label: 'HD 2 (HP100K)' },
  { id: 'M03', label: 'HD 3 (HP100K)' },
  { id: 'M04', label: 'HD 4 (HP100K)' },
  { id: 'M05', label: 'HM 1' },
  { id: 'M06', label: 'HM 2' },
  { id: 'M07', label: 'NORITSU' },
  { id: 'M08', label: 'VSP' },
  { id: 'M09', label: 'MASTER CUT 1' },
  { id: 'M10', label: 'MASTER CUT 2' },
  { id: 'M11', label: 'MASTER CUT 3' },
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