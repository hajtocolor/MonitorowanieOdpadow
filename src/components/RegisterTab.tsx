import React, { useState, useEffect, useRef } from 'react';
import { WasteEntry, WasteReason, MACHINES, REASONS } from '../types';
import { useWasteStore } from '../store';
import { format } from 'date-fns';

function getNow() {
  const now = new Date();
  return {
    date: format(now, 'yyyy-MM-dd'),
    time: format(now, 'HH:mm'),
  };
}

interface Props {
  addEntry: ReturnType<typeof useWasteStore>['addEntry'];
  entries: WasteEntry[];
  deleteEntry: (id: string) => void;
  canDelete: boolean;
}

export default function RegisterTab({ addEntry, entries, deleteEntry, canDelete }: Props) {
  const [machine, setMachine] = useState('');
  const [reason, setReason] = useState<WasteReason>('procesowy');
  const [weight, setWeight] = useState('');
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(getNow());
  const weightRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(getNow()), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) { setError('Wybierz numer maszyny.'); return; }
    const w = parseFloat(weight.replace(',', '.'));
    if (isNaN(w) || w <= 0) { setError('Podaj poprawną wagę (np. 3.5).'); return; }
    if (w > 1000) { setError('Waga wydaje się za duża. Sprawdź jednostkę (kg).'); return; }
    setError('');

    const current = getNow();
    addEntry({
      date: current.date,
      time: current.time,
      machineId: machine,
      reason,
      weightKg: w,
      comment: comment.trim() || undefined,
    });

    setWeight('');
    setComment('');
    setSuccess(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSuccess(false), 3000);
    weightRef.current?.focus();
  };

  const todayEntries = entries.filter(e => e.date === getNow().date);

  return (
    <div className="space-y-6">
      {/* PROCESS REMINDER BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 p-5 text-white shadow-lg">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">Proces – wykonaj w tej kolejności</p>
        <div className="flex flex-wrap gap-2">
          {[
            { step: '1', icon: '⚖️', label: 'Zważ odpad' },
            { step: '2', icon: '🗑️', label: 'Wrzuć do pojemnika' },
            { step: '3', icon: '📱', label: 'Otwórz ten system' },
            { step: '4', icon: '✏️', label: 'Wpisz maszynę + wagę' },
          ].map(({ step, icon, label }) => (
            <div key={step} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">{step}</span>
              <span className="text-lg">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* FORM */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">📝 Nowe zgłoszenie</h2>
              <div className="text-right text-sm text-slate-500">
                <div className="font-semibold text-slate-700">{now.date}</div>
                <div>{now.time} (auto)</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Machine */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Numer maszyny <span className="text-red-500">*</span>
                </label>
                <select
                  value={machine}
                  onChange={e => setMachine(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-800 transition focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="">— Wybierz maszynę —</option>
                  {MACHINES.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Przyczyna odpadów</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(Object.entries(REASONS) as [WasteReason, typeof REASONS[WasteReason]][]).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setReason(key)}
                      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition ${
                        reason === key
                          ? `${val.border} ${val.bg} ${val.color} ring-2 ring-offset-1 ring-current`
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-2xl">{val.emoji}</span>
                      <span className="text-sm font-semibold leading-tight">{val.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Waga (kg) <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs font-normal text-slate-400">Tolerancja ±10% – nie musisz być dokładny co do grama</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={weightRef}
                    type="number"
                    min="0.1"
                    max="999"
                    step="0.1"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="np. 3.5"
                    className="w-full rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-xl font-bold text-slate-800 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <span className="text-xl font-semibold text-slate-500">kg</span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Komentarz <span className="text-xs font-normal text-slate-400">(całkowicie opcjonalny)</span>
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="np. uszkodzona forma nr 3..."
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 transition focus:border-slate-400 focus:bg-white focus:outline-none"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 border border-red-200">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 border border-emerald-200 animate-pulse">
                  ✅ Zgłoszenie zapisane! Możesz wpisać kolejny odpad.
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition hover:from-emerald-600 hover:to-green-700 active:scale-95"
              >
                ✓ Zapisz zgłoszenie
              </button>
            </form>
          </div>
        </div>

        {/* BIN GUIDE */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Przewodnik pojemników</h3>
            <div className="space-y-3">
              {(Object.entries(REASONS) as [WasteReason, typeof REASONS[WasteReason]][]).map(([key, val]) => (
                <div key={key} className={`flex items-center gap-3 rounded-xl border-2 ${val.border} ${val.bg} p-3`}>
                  <div className={`h-10 w-10 shrink-0 rounded-lg ${val.binColor} flex items-center justify-center text-xl shadow-inner`}>
                    {val.emoji}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${val.color}`}>{val.label}</div>
                    <div className="text-xs text-slate-500">
                      {key === 'awaria' && 'Pojemnik CZERWONY'}
                      {key === 'blad_operatora' && 'Pojemnik ŻÓŁTY'}
                      {key === 'procesowy' && 'Pojemnik SZARY/BIAŁY'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">⚠️ Ważna zasada</p>
            <p className="text-sm text-amber-800">
              System NIE służy do oceny operatorów. Celem jest wykrycie awarii maszyn, nie wskazywanie winnych.
            </p>
          </div>
        </div>
      </div>

      {/* TODAY'S ENTRIES */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-800">
            📋 Zgłoszenia z dzisiaj ({now.date})
          </h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {todayEntries.length} wpisów / {todayEntries.reduce((s, e) => s + e.weightKg, 0).toFixed(1)} kg
          </span>
        </div>
        {todayEntries.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <p>Brak zgłoszeń na dziś. Zacznij od pierwszego wpisu powyżej.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {todayEntries.slice(0, 20).map(entry => {
              const r = REASONS[entry.reason];
              return (
                <div key={entry.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50">
                  <span className="text-xl">{r.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{entry.machineId}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.bg} ${r.color} ${r.border} border`}>
                        {r.label}
                      </span>
                    </div>
                    {entry.comment && (
                      <p className="truncate text-xs text-slate-400">{entry.comment}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">{entry.weightKg} kg</div>
                    <div className="text-xs text-slate-400">{entry.time}</div>
                  </div>
                  {canDelete ? (
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="ml-2 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400 transition"
                      title="Usuń wpis"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
