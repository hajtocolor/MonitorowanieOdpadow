import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { WasteEntry, AREAS } from '../types';
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
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const cutoff = format(subDays(new Date(), period), 'yyyy-MM-dd');
    return entries.filter(e => e.date >= cutoff);
  }, [entries, period]);

  const areaStats = useMemo(() => {
    const allAreaIds = [...new Set(filtered.map(e => e.area))];
    const totalAll = filtered.reduce((s, e) => s + e.weightKg, 0);

    return allAreaIds
      .map((id, idx) => {
        const aEntries = filtered.filter(e => e.area === id);
        const totalKg = parseFloat(aEntries.reduce((s, e) => s + e.weightKg, 0).toFixed(1));
        const areaInfo = AREAS.find(a => a.id === id);
        return {
          id,
          label: areaInfo?.label ?? id,
          shortLabel: id,
          count: aEntries.length,
          totalKg,
          pct: totalAll > 0 ? Math.round((totalKg / totalAll) * 100) : 0,
          color: GRADIENT_COLORS[idx % GRADIENT_COLORS.length],
        };
      })
      .sort((a, b) => b.totalKg - a.totalKg);
  }, [filtered]);

  // Weekly breakdown for selected area
  const selectedAreaWeekly = useMemo(() => {
    if (!selectedArea) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayEntries = entries.filter(e => e.area === selectedArea && e.date === dateStr);
      return {
        day: format(d, 'EEE dd.MM'),
        awaria: parseFloat(dayEntries.filter(e => e.reason === 'awaria').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
        procesowy: parseFloat(dayEntries.filter(e => e.reason === 'procesowy').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
      };
    });
  }, [selectedArea, entries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">🗺️ Analiza według obszaru</h2>
          <p className="text-sm text-slate-500">Ranking obszarów generujących największe straty</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {areaStats.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-400">
          <div className="text-5xl mb-3">🏭</div>
          <p className="font-medium">Brak danych dla wybranego okresu</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-base font-bold text-slate-800">Ranking strat według obszaru (kg)</h3>
            <p className="mb-4 text-xs text-slate-400">Ostatnie {period} dni · kliknij słupek aby zobaczyć szczegóły</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={areaStats}
                margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
                onClick={(e: unknown) => {
                  const ev = e as { activePayload?: Array<{ payload: { id: string } }> } | null;
                  if (ev?.activePayload?.[0]) {
                    const id = ev.activePayload[0].payload.id;
                    setSelectedArea(prev => prev === id ? null : id);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="shortLabel" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" kg" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v: unknown) => [`${v} kg`, 'Odpady']}
                  labelFormatter={(label: unknown) => `Obszar ${label}`}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="totalKg" radius={[6, 6, 0, 0]} cursor="pointer">
                  {areaStats.map((entry, index) => (
                    <Cell
                      key={entry.id}
                      fill={entry.id === selectedArea ? '#4f46e5' : GRADIENT_COLORS[index % GRADIENT_COLORS.length]}
                      opacity={selectedArea && entry.id !== selectedArea ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-bold text-slate-800">🏆 Pełny ranking obszarów</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {areaStats.map((a, idx) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition hover:bg-slate-50 ${selectedArea === a.id ? 'bg-indigo-50' : ''}`}
                  onClick={() => setSelectedArea(prev => prev === a.id ? null : a.id)}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black
                    ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-slate-100 text-slate-500' : idx === 2 ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'}`}>
                    {idx + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-800">{a.label}</div>
                    <div className="mt-1 text-xs text-slate-500">{a.count} wpisów</div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-slate-800">{a.totalKg} kg</div>
                    <div className="text-xs text-slate-400">{a.count} wpisów · {a.pct}% całości</div>
                  </div>

                  <div className="w-24 shrink-0">
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${a.pct}%`, background: a.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedArea && selectedAreaWeekly && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
              <h3 className="mb-4 font-bold text-indigo-900">
                🔍 Szczegóły: {AREAS.find(a => a.id === selectedArea)?.label ?? selectedArea} – ostatnie 7 dni
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={selectedAreaWeekly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6366f1' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#a5b4fc' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #c7d2fe', fontSize: 12 }}
                    formatter={(v: unknown, name: unknown) => [
                      `${v} kg`,
                      name === 'awaria' ? '🔴 Awaria' : '⬜ Procesowy',
                    ]}
                  />
                  <Bar dataKey="awaria" stackId="a" fill="#ef4444" />
                  <Bar dataKey="procesowy" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {areaStats[0] && areaStats[0].pct >= 30 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
              <span className="text-2xl shrink-0">⚠️</span>
              <div>
                <p className="font-bold text-red-800">Uwaga – Obszar {areaStats[0].id} generuje {areaStats[0].pct}% wszystkich odpadów!</p>
                <p className="mt-1 text-sm text-red-700">
                  Obszar <strong>{areaStats[0].label}</strong> odpowiada za {areaStats[0].totalKg} kg odpadów
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