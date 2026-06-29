export type WasteReason = 'awaria' | 'procesowy';

export interface WasteEntry {
  id: string;
  date: string;       // ISO date string YYYY-MM-DD
  time: string;       // HH:MM
  area: string;
  classificationNumber: string;
  binNumber: string;
  reason: WasteReason;
  weightKg: number;
  comment?: string;
  createdAt: string;  // full ISO timestamp
}

export interface Bin {
  id: string;
  binNumber: string;
  classificationCode: string;
  description: string;
  areaIds: string[] | null;
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

export interface Area {
  id: string;
  label: string;
}

export type UserRole = 'admin' | 'worker';

export const AREAS: Area[] = [
  { id: 'VSP', label: 'VSP' },
  { id: 'DRUKARNIA_HP', label: 'Drukarnia HP' },
  { id: 'NORITSU', label: 'Noritsu' },
  { id: 'INTROFUN', label: 'Introfun' },
];

export const REASONS: Record<WasteReason, { label: string; color: string; bg: string; border: string; emoji: string; binColor: string }> = {
  awaria: {
    label: 'Awaria maszyny',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-300',
    emoji: '🔴',
    binColor: 'bg-red-500',
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