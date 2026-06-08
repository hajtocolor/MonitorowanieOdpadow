import { useMemo, useState } from 'react';
import { WasteEntry, WasteReason, MACHINES, REASONS } from '../types';
import { format } from 'date-fns';

interface Props {
  entries: WasteEntry[];
  deleteEntry: (id: string) => void;
  clearAll: () => void;
}

export default function HistoryTab({ entries, deleteEntry, clearAll }: Props) {
  const [filterReason, setFilterReason] = useState<WasteReason | 'all'>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);
  const PAGE_SIZE = 25;

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (filterReason !== 'all' && e.reason !== filterReason) return false;
      if (filterMachine !== 'all' && e.machineId !== filterMachine) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.machineId.toLowerCase().includes(q) &&
            !e.classificationNumber.toLowerCase().includes(q) &&
            !e.binNumber.toLowerCase().includes(q) &&
            !e.comment?.toLowerCase().includes(q) &&
            !e.date.includes(q)) return false;
      }
      return true;
    });
  }, [entries, filterReason, filterMachine, search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const exportCSV = () => {
    const header = ['Data', 'Godzina', 'Maszyna', 'Klasyfikacja', 'Pojemnik', 'Przyczyna', 'Waga_kg', 'Komentarz'];
    const rows = filtered.map(e => [
      e.date,
      e.time,
      e.machineId,
      e.classificationNumber,
      e.binNumber,
      REASONS[e.reason].label,
      e.weightKg.toString().replace('.', ','),
      e.comment ?? '',
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `odpady_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allMachineIds = [...new Set(entries.map(e => e.machineId))].sort();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">📋 Historia wpisów</h2>
          <p className="text-sm text-slate-500">Pełny rejestr wszystkich zgłoszeń odpadów</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition"
          >
            📥 Eksportuj CSV
          </button>
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
            >
              🗑️ Wyczyść wszystko
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-semibold">Na pewno?</span>
              <button
                onClick={() => { clearAll(); setConfirmClear(false); }}
                className="rounded-xl bg-red-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-700"
              >Tak, usuń</button>
              <button
                onClick={() => setConfirmClear(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >Anuluj</button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1 min-w-48">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Szukaj maszyny, daty, komentarza..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <select
          value={filterReason}
          onChange={e => { setFilterReason(e.target.value as WasteReason | 'all'); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        >
          <option value="all">Wszystkie przyczyny</option>
          <option value="awaria">🟥 Awaria maszyny</option>
          <option value="blad_operatora">🟨 Błąd operatora</option>
          <option value="procesowy">⬜ Procesowy</option>
        </select>
        <select
          value={filterMachine}
          onChange={e => { setFilterMachine(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
        >
          <option value="all">Wszystkie maszyny</option>
          {allMachineIds.map(id => {
            const m = MACHINES.find(m => m.id === id);
            return <option key={id} value={id}>{m?.label ?? id}</option>;
          })}
        </select>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
        <span>Znaleziono: <strong>{filtered.length}</strong> wpisów</span>
        <span>Łącznie: <strong>{filtered.reduce((s, e) => s + e.weightKg, 0).toFixed(1)} kg</strong></span>
        {filterReason !== 'all' || filterMachine !== 'all' || search ? (
          <button
            onClick={() => { setFilterReason('all'); setFilterMachine('all'); setSearch(''); setPage(1); }}
            className="text-indigo-600 hover:underline font-medium"
          >
            ✕ Wyczyść filtry
          </button>
        ) : null}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {paginated.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <div className="text-4xl mb-2">🔍</div>
            <p>Brak wpisów pasujących do filtrów</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-left font-semibold text-slate-500">Data</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-500">Godz.</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-500">Maszyna</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-500">Klasyfikacja</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-500">Pojemnik</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-500">Przyczyna</th>
                    <th className="px-3 py-3 text-right font-semibold text-slate-500">Waga</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-500">Komentarz</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map(entry => {
                    const r = REASONS[entry.reason];
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-3 text-slate-700 font-medium whitespace-nowrap">
                          {entry.date}
                        </td>
                        <td className="px-3 py-3 text-slate-500 whitespace-nowrap">{entry.time}</td>
                        <td className="px-3 py-3">
                          <span className="font-bold text-slate-800">{entry.machineId}</span>
                        </td>
                        <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{entry.classificationNumber}</td>
                        <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{entry.binNumber}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${r.bg} ${r.color} ${r.border}`}>
                            {r.emoji} {r.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-black text-slate-800 whitespace-nowrap">
                          {entry.weightKg} kg
                        </td>
                        <td className="px-3 py-3 text-slate-400 max-w-xs truncate">{entry.comment ?? '—'}</td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400 transition"
                            title="Usuń wpis"
                          >✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginated.map(entry => {
                const r = REASONS[entry.reason];
                return (
                  <div key={entry.id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50">
                    <span className="text-xl mt-0.5">{r.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{entry.machineId}</span>
                        <span className="text-xs text-slate-400">{entry.date} {entry.time}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Klasyfikacja: <span className="font-semibold text-slate-700">{entry.classificationNumber}</span>
                        <span className="mx-2">•</span>
                        Pojemnik: <span className="font-semibold text-slate-700">{entry.binNumber}</span>
                      </div>
                      <div className={`mt-0.5 text-xs font-medium ${r.color}`}>{r.label}</div>
                      {entry.comment && <div className="text-xs text-slate-400 truncate">{entry.comment}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-slate-800">{entry.weightKg} kg</div>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-xs text-slate-300 hover:text-red-400 transition"
                      >✕ usuń</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
          >
            ← Poprzednia
          </button>
          <span className="text-sm text-slate-500">Strona {page} z {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition"
          >
            Następna →
          </button>
        </div>
      )}
    </div>
  );
}
