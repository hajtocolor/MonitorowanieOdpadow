import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { WasteEntry, WasteReason, REASONS } from '../types';

interface Props {
  entries: WasteEntry[];
}

const PERIODS = [
  { label: '7 dni', days: 7 },
  { label: '14 dni', days: 14 },
  { label: '30 dni', days: 30 },
];

export default function ReasonAnalysisTab({ entries }: Props) {
  const [period, setPeriod] = useState(30);

  const filtered = useMemo(() => {
    const cutoff = format(subDays(new Date(), period), 'yyyy-MM-dd');
    return entries.filter(e => e.date >= cutoff);
  }, [entries, period]);

  const data = useMemo(() => {
    return Array.from({ length: period }, (_, i) => {
      const d = subDays(new Date(), period - 1 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayEntries = filtered.filter(e => e.date === dateStr);
      return {
        day: format(d, 'd MMM', { locale: pl }),
        dateStr,
        awaria: parseFloat(dayEntries.filter(e => e.reason === 'awaria').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
        blad_operatora: parseFloat(dayEntries.filter(e => e.reason === 'blad_operatora').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
        procesowy: parseFloat(dayEntries.filter(e => e.reason === 'procesowy').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
      };
    }).filter((_, i) => period <= 14 || i % 2 === 0); // thin out for 30-day view
  }, [filtered, period]);

  const summaryByReason = useMemo(() => {
    const reasons: WasteReason[] = ['awaria', 'blad_operatora', 'procesowy'];
    return reasons.map(r => {
      const rEntries = filtered.filter(e => e.reason === r);
      const total = rEntries.reduce((s, e) => s + e.weightKg, 0);
      const totalAll = filtered.reduce((s, e) => s + e.weightKg, 0);
      return {
        reason: r,
        ...REASONS[r],
        count: rEntries.length,
        totalKg: parseFloat(total.toFixed(1)),
        avgKg: rEntries.length > 0 ? parseFloat((total / rEntries.length).toFixed(1)) : 0,
        pct: totalAll > 0 ? Math.round((total / totalAll) * 100) : 0,
      };
    });
  }, [filtered]);

  // Most common comment per reason
  const commentsByReason = useMemo(() => {
    const reasons: WasteReason[] = ['awaria', 'blad_operatora', 'procesowy'];
    return Object.fromEntries(reasons.map(r => {
      const comments = filtered
        .filter(e => e.reason === r && e.comment)
        .map(e => e.comment!);
      const freq: Record<string, number> = {};
      comments.forEach(c => { freq[c] = (freq[c] || 0) + 1; });
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3);
      return [r, sorted];
    }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header & period filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">🤖 Analiza według przyczyny</h2>
          <p className="text-sm text-slate-500">Automatyczny podział odpadów na kategorie przyczyn</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                period === p.days
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryByReason.map(r => (
          <div key={r.reason} className={`rounded-2xl border-2 ${r.border} ${r.bg} p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl mb-2">{r.emoji}</div>
                <div className={`text-sm font-bold ${r.color}`}>{r.label}</div>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-bold ${r.bg} border ${r.border} ${r.color}`}>
                {r.pct}%
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xl font-black text-slate-800">{r.totalKg}</div>
                <div className="text-xs text-slate-500">kg łącznie</div>
              </div>
              <div>
                <div className="text-xl font-black text-slate-800">{r.count}</div>
                <div className="text-xs text-slate-500">wpisów</div>
              </div>
              <div>
                <div className="text-xl font-black text-slate-800">{r.avgKg}</div>
                <div className="text-xs text-slate-500">kg / wpis</div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 w-full rounded-full bg-white/60">
              <div
                className={`h-2 rounded-full ${
                  r.reason === 'awaria' ? 'bg-red-500' : r.reason === 'blad_operatora' ? 'bg-yellow-400' : 'bg-slate-400'
                }`}
                style={{ width: `${r.pct}%` }}
              />
            </div>
            {/* Top comments */}
            {commentsByReason[r.reason]?.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Najczęstsze komentarze</p>
                {commentsByReason[r.reason].map(([comment, count]) => (
                  <div key={comment} className="flex justify-between text-xs text-slate-600">
                    <span className="truncate">{comment}</span>
                    <span className="ml-2 shrink-0 font-semibold">{count}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stacked bar chart over time */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-bold text-slate-800">Trend dzienny według przyczyny (kg)</h3>
        <p className="mb-4 text-xs text-slate-400">Ostatnie {period} dni – co {period > 14 ? '2' : '1'} dzień</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              angle={-30}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              formatter={(v: unknown, name: unknown) => [
                `${v} kg`,
                name === 'awaria' ? '🟥 Awaria maszyny' : name === 'blad_operatora' ? '🟨 Błąd operatora' : '⬜ Procesowy',
              ]}
            />
            <Bar dataKey="awaria" stackId="a" fill="#ef4444" />
            <Bar dataKey="blad_operatora" stackId="a" fill="#eab308" />
            <Bar dataKey="procesowy" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-500 inline-block"></span> Awaria maszyny</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-yellow-400 inline-block"></span> Błąd operatora</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300 inline-block"></span> Procesowy</span>
        </div>
      </div>

      {/* Insight box */}
      {filtered.length > 0 && (() => {
        const dominant = summaryByReason.sort((a, b) => b.totalKg - a.totalKg)[0];
        return (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <p className="text-sm font-bold text-indigo-800 mb-1">💡 Automatyczny wniosek</p>
            <p className="text-sm text-indigo-700">
              W wybranym okresie dominującą przyczyną odpadów jest{' '}
              <strong>{dominant.label}</strong> ({dominant.emoji}) – stanowiące{' '}
              <strong>{dominant.pct}%</strong> łącznych odpadów ({dominant.totalKg} kg).
              {dominant.reason === 'awaria' && ' Zalecana analiza historii awarii maszyn i przegląd prewencyjny.'}
              {dominant.reason === 'blad_operatora' && ' Zalecane dodatkowe szkolenie lub weryfikacja procedur operacyjnych.'}
              {dominant.reason === 'procesowy' && ' Poziom odpadów procesowych jest dominujący – sprawdź czy można zoptymalizować parametry procesu.'}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
