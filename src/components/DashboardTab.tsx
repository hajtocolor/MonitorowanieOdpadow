import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { pl } from 'date-fns/locale';
import { WasteEntry, WasteReason } from '../types';

interface Props {
  entries: WasteEntry[];
}

const REASON_COLORS: Record<WasteReason, string> = {
  awaria: '#ef4444',
  blad_operatora: '#eab308',
  procesowy: '#94a3b8',
};

export default function DashboardTab({ entries }: Props) {
  const stats = useMemo(() => {
    const total = entries.reduce((s, e) => s + e.weightKg, 0);
    const byReason = {
      awaria: entries.filter(e => e.reason === 'awaria').reduce((s, e) => s + e.weightKg, 0),
      blad_operatora: entries.filter(e => e.reason === 'blad_operatora').reduce((s, e) => s + e.weightKg, 0),
      procesowy: entries.filter(e => e.reason === 'procesowy').reduce((s, e) => s + e.weightKg, 0),
    };

    // Last 7 days trend
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayEntries = entries.filter(e => e.date === dateStr);
      return {
        day: format(d, 'EEE', { locale: pl }),
        date: dateStr,
        awaria: parseFloat(dayEntries.filter(e => e.reason === 'awaria').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
        blad_operatora: parseFloat(dayEntries.filter(e => e.reason === 'blad_operatora').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
        procesowy: parseFloat(dayEntries.filter(e => e.reason === 'procesowy').reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
        total: parseFloat(dayEntries.reduce((s, e) => s + e.weightKg, 0).toFixed(1)),
      };
    });

    // Today
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayKg = entries.filter(e => e.date === todayStr).reduce((s, e) => s + e.weightKg, 0);
    const todayCount = entries.filter(e => e.date === todayStr).length;

    // This week
    const weekEntries = last7.reduce((s, d) => s + d.total, 0);

    // Pie data
    const pieData = [
      { name: 'Awaria maszyny', value: parseFloat(byReason.awaria.toFixed(1)), color: REASON_COLORS.awaria },
      { name: 'Błąd operatora', value: parseFloat(byReason.blad_operatora.toFixed(1)), color: REASON_COLORS.blad_operatora },
      { name: 'Procesowy', value: parseFloat(byReason.procesowy.toFixed(1)), color: REASON_COLORS.procesowy },
    ].filter(d => d.value > 0);

    return { total, byReason, last7, todayKg, todayCount, weekEntries, pieData };
  }, [entries]);

  const kpiCards = [
    {
      label: 'Łącznie (wszystkie)',
      value: `${stats.total.toFixed(1)} kg`,
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
      label: 'Ostatnie 7 dni',
      value: `${stats.weekEntries.toFixed(1)} kg`,
      sub: 'bieżący tydzień',
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

  return (
    <div className="space-y-6">
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
        {/* 7-day bar chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-base font-bold text-slate-800">Odpady – ostatnie 7 dni (kg)</h3>
          <p className="mb-4 text-xs text-slate-400">Podział na przyczyny według dnia</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.last7} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
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
          <p className="mb-4 text-xs text-slate-400">Cały okres historyczny (kg)</p>
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
        <p className="mb-4 text-xs text-slate-400">Ostatnie 7 dni</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={stats.last7} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
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
