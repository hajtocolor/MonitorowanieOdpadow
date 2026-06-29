import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { WasteEntry, WasteReason } from '../types';
import PeriodFilter from './PeriodFilter';

interface Props {
  entries: WasteEntry[];
}

const REASON_COLORS: Record<WasteReason, string> = {
  awaria: '#ef4444',
  blad_operatora: '#eab308',
  procesowy: '#94a3b8',
};

export default function DashboardTab({ entries }: Props) {
  const [period, setPeriod] = useState(7);

  const filtered = useMemo(() => {
    if (period <= 0) return entries; // wszystkie dane
    const cutoff = format(subDays(new Date(), period), 'yyyy-MM-dd');
    return entries.filter(e => e.date >= cutoff);
  }, [entries, period]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s, e) => s + e.weightKg, 0);
    const byReason = {
      awaria: filtered.filter(e => e.reason === 'awaria').reduce((s, e) => s + e.weightKg, 0),
      blad_operatora: filtered.filter(e => e.reason === 'blad_operatora').reduce((s, e) => s + e.weightKg, 0),
      procesowy: filtered.filter(e => e.reason === 'procesowy').reduce((s, e) => s + e.weightKg, 0),
    };

    // Trend w wybranym okresie (zagęszczenie: max ~30 punktów na wykresie)
    const daysToShow = period > 0 ? Math.min(period, 365) : 30;
    const step = Math.max(1, Math.floor(daysToShow / 30));
    const trend = Array.from({ length: Math.ceil(daysToShow / step) }, (_, i) => {
      const dayOffset = daysToShow - 1 - i * step;
      const d = subDays(new Date(), dayOffset);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayEntries = filtered.filter(e => e.date === dateStr);
      return {
        day: format(d, 'd.MM', { locale: pl }),
        date: dateStr,
        awaria: parseFloat(dayEntries.filter(e => e.reason === 'awaria').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
        blad_operatora: parseFloat(dayEntries.filter(e => e.reason === 'blad_operatora').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
        procesowy: parseFloat(dayEntries.filter(e => e.reason === 'procesowy').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
        total: parseFloat(dayEntries.reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
      };
    });

    // Today
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayKg = filtered.filter(e => e.date === todayStr).reduce((s, e) => s + e.weightKg, 0);
    const todayCount = filtered.filter(e => e.date === todayStr).length;

    // Total in period
    const periodEntries = trend.reduce((s, d) => s + d.total, 0);

    // Pie data
    const pieData = [
      { name: 'Awaria maszyny', value: parseFloat(byReason.awaria.toFixed(1)), color: REASON_COLORS.awaria },
      { name: 'Błąd operatora', value: parseFloat(byReason.blad_operatora.toFixed(1)), color: REASON_COLORS.blad_operatora },
      { name: 'Procesowy', value: parseFloat(byReason.procesowy.toFixed(1)), color: REASON_COLORS.procesowy },
    ].filter(d => d.value > 0);

    return { total, byReason, trend, todayKg, todayCount, periodEntries, pieData, daysToShow };
  }, [filtered, period]);

  const kpiCards = [
    {
      label: 'Łącznie (wszystkie)',
      value: `${entries.reduce((s, e) => s + e.weightKg, 0).toFixed(1)} kg`,
      sub: `${entries.length} zgłoszeń`,
      gradient: 'from-slate-700 to-slate-800',
      icon: '📦',
    },
    {
      label: 'Dzisiaj',
      value: `${stats.todayKg.toFixed(1)} kg`,
      sub: `${stats.todayCount} wpisów`,
      gradient: 'from-blue-500 to-blue-700',
      icon: '📅',
    },
    {
      label: `Wybrany okres`,
      value: `${stats.periodEntries.toFixed(1)} kg`,
      sub: stats.daysToShow > 0 ? `ostatnie ${stats.daysToShow} dni` : 'całość',
      gradient: 'from-indigo-500 to-violet-600',
      icon: '📈',
    },
    {
      label: '🟥 Awarie maszyn',
      value: `${stats.byReason.awaria.toFixed(1)} kg`,
      sub: stats.total > 0 ? `${((stats.byReason.awaria / stats.total) * 100).toFixed(0)}% całości` : '—',
      gradient: 'from-red-500 to-red-700',
      icon: '🔧',
    },
    {
      label: '🟨 Błędy operatora',
      value: `${stats.byReason.blad_operatora.toFixed(1)} kg`,
      sub: stats.total > 0 ? `${((stats.byReason.blad_operatora / stats.total) * 100).toFixed(0)}% całości` : '—',
      gradient: 'from-yellow-400 to-amber-500',
      icon: '👷',
    },
    {
      label: '⬜ Procesowy',
      value: `${stats.byReason.procesowy.toFixed(1)} kg`,
      sub: stats.total > 0 ? `${((stats.byReason.procesowy / stats.total) * 100).toFixed(0)}% całości` : '—',
      gradient: 'from-slate-400 to-slate-500',
      icon: '⚙️',
    },
  ];

  const periodLabel = stats.daysToShow > 0 ? `ostatnie ${stats.daysToShow} dni` : 'cały okres';

  return (
    <div className="space-y-6">
      {/* Header & period filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">📊 Dashboard</h2>
          <p className="text-sm text-slate-500">Podsumowanie i analiza odpadów – {periodLabel}</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map(card => (
          <div key={card.label} className={`rounded-2xl bg-gradient-to-br ${card.gradient} p-4 text-white shadow-lg`}>
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className="text-2xl font-black leading-tight">{card.value}</div>
            <div className="text-xs font-semibold opacity-80 mt-1">{card.label}</div>
            <div className="text-xs opacity-60 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* CHARTS ROW */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend bar chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-base font-bold text-slate-800">Trend odpadów (kg) – {periodLabel}</h3>
          <p className="mb-4 text-xs text-slate-400">Podział na przyczyny według dnia</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(val: unknown, name: unknown) => [
                  `${val} kg`,
                  name === 'awaria' ? '🟥 Awaria' : name === 'blad_operatora' ? '🟨 Błąd op.' : '⬜ Procesowy',
                ]}
              />
              <Bar dataKey="awaria" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="blad_operatora" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
              <Bar dataKey="procesowy" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-500 inline-block"></span> Awaria</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-yellow-400 inline-block"></span> Błąd op.</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300 inline-block"></span> Procesowy</span>
          </div>
        </div>

        {/* Pie */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
          <h3 className="mb-1 text-base font-bold text-slate-800">Podział według przyczyny</h3>
          <p className="mb-4 text-xs text-slate-400">{periodLabel} (kg)</p>
          {stats.pieData.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-slate-300 text-sm">Brak danych</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => [`${v} kg`]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {stats.pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: d.color }}></span>
                      <span className="text-slate-600">{d.name}</span>
                    </span>
                    <span className="font-bold text-slate-800">{d.value} kg</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Trend line */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-base font-bold text-slate-800">Trend dzienny – łącznie (kg)</h3>
        <p className="mb-4 text-xs text-slate-400">{periodLabel}</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={stats.trend} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              formatter={(v: unknown) => [`${v} kg`, 'Łącznie']}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}