import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { WasteEntry, MACHINES, WasteReason } from '../types';
import PeriodFilter from './PeriodFilter';

interface Props {
  entries: WasteEntry[];
}

const GRADIENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

export default function MachineAnalysisTab({ entries }: Props) {
  const [period, setPeriod] = useState(30);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const cutoff = format(subDays(new Date(), period), 'yyyy-MM-dd');
    return entries.filter(e => e.date >= cutoff);
  }, [entries, period]);

  const machineStats = useMemo(() => {
    const allMachineIds = [...new Set(filtered.map(e => e.machineId))];
    const totalAll = filtered.reduce((s, e) => s + e.weightKg, 0);

    return allMachineIds
      .map((id, idx) => {
        const mEntries = filtered.filter(e => e.machineId === id);
        const totalKg = parseFloat(mEntries.reduce((s, e) => s + e.weightKg, 0).toFixed(1));
        const byReason: Record<WasteReason, number> = {
          awaria: parseFloat(mEntries.filter(e => e.reason === 'awaria').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
          blad_operatora: parseFloat(mEntries.filter(e => e.reason === 'blad_operatora').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
          procesowy: parseFloat(mEntries.filter(e => e.reason === 'procesowy').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
        };
        const machineInfo = MACHINES.find(m => m.id === id);
        return {
          id,
          label: machineInfo?.label ?? id,
          shortLabel: id,
          count: mEntries.length,
          totalKg,
          byReason,
          pct: totalAll > 0 ? Math.round((totalKg / totalAll) * 100) : 0,
          color: GRADIENT_COLORS[idx % GRADIENT_COLORS.length],
        };
      })
      .sort((a, b) => b.totalKg - a.totalKg);
  }, [filtered]);

  // Weekly breakdown for selected machine
  const selectedMachineWeekly = useMemo(() => {
    if (!selectedMachine) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayEntries = entries.filter(e => e.machineId === selectedMachine && e.date === dateStr);
      return {
        day: format(d, 'EEE dd.MM'),
        awaria: parseFloat(dayEntries.filter(e => e.reason === 'awaria').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
        blad_operatora: parseFloat(dayEntries.filter(e => e.reason === 'blad_operatora').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
        procesowy: parseFloat(dayEntries.filter(e => e.reason === 'procesowy').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
      };
    });
  }, [selectedMachine, entries]);

  return (
    <div className="space-y-6">
      {/* Header & period filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">⚙️ Analiza według maszyny</h2>
          <p className="text-sm text-slate-500">Ranking maszyn generujących największe straty – aktualizuje się automatycznie</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {machineStats.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-400">
          <div className="text-5xl mb-3">🏭</div>
          <p className="font-medium">Brak danych dla wybranego okresu</p>
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-base font-bold text-slate-800">Ranking strat według maszyny (kg)</h3>
            <p className="mb-4 text-xs text-slate-400">Ostatnie {period} dni · kliknij słupek aby zobaczyć szczegóły</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={machineStats}
                margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
                onClick={(e: unknown) => {
                  const ev = e as { activePayload?: Array<{ payload: { id: string } }> } | null;
                  if (ev?.activePayload?.[0]) {
                    const id = ev.activePayload[0].payload.id;
                    setSelectedMachine(prev => prev === id ? null : id);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="shortLabel" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" kg" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: unknown) => [`${v} kg`, 'Odpady']}
                  labelFormatter={(label: unknown) => `Maszyna ${label}`}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="totalKg" radius={[6, 6, 0, 0]} cursor="pointer">
                  {machineStats.map((entry, index) => (
                    <Cell
                      key={entry.id}
                      fill={entry.id === selectedMachine ? '#4f46e5' : GRADIENT_COLORS[index % GRADIENT_COLORS.length]}
                      opacity={selectedMachine && entry.id !== selectedMachine ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ranking table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-800">🏆 Pełny ranking maszyn</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {machineStats.map((m, idx) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition hover:bg-slate-50 ${selectedMachine === m.id ? 'bg-indigo-50' : ''}`}
                  onClick={() => setSelectedMachine(prev => prev === m.id ? null : m.id)}
                >
                  {/* Rank */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black
                    ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-100 text-slate-500' : idx === 2 ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'}`}>
                    {idx + 1}
                  </div>

                  {/* Machine name */}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800">{m.label}</div>
                    <div className="mt-1.5 flex gap-2 text-xs">
                      {m.byReason.awaria > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-red-700 border border-red-200">
                          🟥 {m.byReason.awaria} kg
                        </span>
                      )}
                      {m.byReason.blad_operatora > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-yellow-700 border border-yellow-200">
                          🟨 {m.byReason.blad_operatora} kg
                        </span>
                      )}
                      {m.byReason.procesowy > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-slate-500 border border-slate-200">
                          ⬜ {m.byReason.procesowy} kg
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-slate-800">{m.totalKg} kg</div>
                    <div className="text-xs text-slate-400">{m.count} wpisów · {m.pct}% całości</div>
                  </div>

                  {/* Bar */}
                  <div className="w-24 shrink-0">
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${m.pct}%`, background: m.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected machine detail */}
          {selectedMachine && selectedMachineWeekly && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
              <h3 className="mb-4 font-bold text-indigo-900">
                🔍 Szczegóły: {MACHINES.find(m => m.id === selectedMachine)?.label ?? selectedMachine} – ostatnie 7 dni
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={selectedMachineWeekly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6366f1' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#a5b4fc' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #c7d2fe', fontSize: 12 }}
                    formatter={(v: unknown, name: unknown) => [
                      `${v} kg`,
                      name === 'awaria' ? '🟥 Awaria' : name === 'blad_operatora' ? '🟨 Błąd op.' : '⬜ Procesowy',
                    ]}
                  />
                  <Bar dataKey="awaria" stackId="a" fill="#ef4444" />
                  <Bar dataKey="blad_operatora" stackId="a" fill="#eab308" />
                  <Bar dataKey="procesowy" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Warning for top machine */}
          {machineStats[0] && machineStats[0].pct >= 30 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
              <span className="text-2xl shrink-0">⚠️</span>
              <div>
                <p className="font-bold text-red-800">Uwaga – Maszyna {machineStats[0].id} generuje {machineStats[0].pct}% wszystkich odpadów!</p>
                <p className="mt-1 text-sm text-red-700">
                  Maszyna <strong>{machineStats[0].label}</strong> odpowiada za {machineStats[0].totalKg} kg odpadów
                  w ostatnich {period} dniach. Zalecana pilna inspekcja i analiza przyczyn.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
