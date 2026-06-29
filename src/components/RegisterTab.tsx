import React, { useState, useEffect, useRef } from 'react';
import { WasteEntry, WasteReason, AREAS, REASONS, UNKNOWN_REASON, Bin } from '../types';
import { useWasteStore } from '../store';
import { getBins, getAreas } from '../api';
import { format } from 'date-fns';

function getNow() {
  const now = new Date();
  return {
    date: format(now, 'yyyy-MM-dd'),
    time: format(now, 'HH:mm'),
  };
}

function readQrParams() {
  const params = new URLSearchParams(window.location.search);
  const area = params.get('area') || '';
  const reason = params.get('reason') as WasteReason | null;
  const classificationNumber = params.get('classificationNumber') || '';
  const binNumber = params.get('binNumber') || '';

  // Clear URL params after reading them (so refresh doesn't re-prefill)
  if (params.has('area') || params.has('reason')) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  return {
    area,
    reason: reason && ['awaria', 'procesowy'].includes(reason) ? reason : null,
    classificationNumber,
    binNumber,
  };
}

interface Props {
  addEntry: ReturnType<typeof useWasteStore>['addEntry'];
  entries: WasteEntry[];
  deleteEntry: (id: string) => void;
  canDelete: boolean;
}

export default function RegisterTab({ addEntry, entries, deleteEntry, canDelete }: Props) {
  const qrParams = useRef(readQrParams());
  const [area, setArea] = useState(qrParams.current.area);
  const [classificationNumber, setClassificationNumber] = useState(qrParams.current.classificationNumber);
  const [binNumber, setBinNumber] = useState(qrParams.current.binNumber);
  const [reason, setReason] = useState<WasteReason>(qrParams.current.reason || 'procesowy');
  const [weight, setWeight] = useState('');
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(getNow());
  const weightRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Areas from backend (dynamic)
  const [areas, setAreas] = useState<{ id: string; label: string }[]>(AREAS);
  const [areasLoading, setAreasLoading] = useState(true);

  // Bins autocomplete
  const [bins, setBins] = useState<Bin[]>([]);
  const [binsLoading, setBinsLoading] = useState(true);

  useEffect(() => {
    getBins()
      .then(data => {
        setBins(data ?? []);
        setBinsLoading(false);
      })
      .catch(() => setBinsLoading(false));

    getAreas()
      .then(data => {
        if (data && data.length > 0) {
          setAreas(data);
        }
        setAreasLoading(false);
      })
      .catch(() => setAreasLoading(false));
  }, []);

  // Auto-fill classification & filter bins when bin number changes
  const handleBinNumberChange = (value: string) => {
    setBinNumber(value);
    const match = bins.find(b => b.binNumber === value.trim());
    if (match) {
      setClassificationNumber(match.classificationCode);
      if (match.areaIds && match.areaIds.length > 0) {
        setArea(match.areaIds[0]);
      }
    }
  };

  // Full bin report state
  const [fullBinReason, setFullBinReason] = useState<WasteReason>('procesowy');
  const [binReportLoading, setBinReportLoading] = useState(false);
  const [binReportSuccess, setBinReportSuccess] = useState(false);
  const [binReportError, setBinReportError] = useState('');
  const binReportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isQrMode = !!qrParams.current.area;

  // Auto-focus weight field when coming from QR scan
  useEffect(() => {
    if (isQrMode) {
      weightRef.current?.focus();
    }
  }, [isQrMode]);

  useEffect(() => {
    const interval = setInterval(() => setNow(getNow()), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!area) { setError('Wybierz obszar.'); return; }
    if (!classificationNumber.trim()) { setError('Podaj numer klasyfikacji odpadu.'); return; }
    if (!binNumber.trim()) { setError('Podaj numer pojemnika.'); return; }
    const w = parseFloat(weight.replace(',', '.'));
    if (isNaN(w) || w <= 0) { setError('Podaj poprawną wagę (np. 3.5).'); return; }
    if (w > 1000) { setError('Waga wydaje się za duża. Sprawdź jednostkę (kg).'); return; }
    setError('');

    const current = getNow();
    addEntry({
      date: current.date,
      time: current.time,
      area,
      classificationNumber: classificationNumber.trim(),
      binNumber: binNumber.trim(),
      reason,
      weightKg: w,
      comment: comment.trim() || undefined,
    });

    setWeight('');
    setClassificationNumber('');
    setBinNumber('');
    setComment('');
    setSuccess(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSuccess(false), 3000);
    weightRef.current?.focus();
  };

  const handleReportFullBin = async () => {
    if (!area) {
      setBinReportError('Najpierw wybierz obszar w formularzu powyżej.');
      return;
    }
    setBinReportLoading(true);
    setBinReportError('');
    setBinReportSuccess(false);

    try {
      const { createBinRequest } = await import('../api');
      await createBinRequest({
        binNumber: binNumber || '(nie podano)',
        reason: fullBinReason,
        requestedBy: area,
      });
      setBinReportSuccess(true);
      if (binReportTimer.current) clearTimeout(binReportTimer.current);
      binReportTimer.current = setTimeout(() => setBinReportSuccess(false), 6000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Błąd wysyłania zgłoszenia';
      setBinReportError(message);
      if (binReportTimer.current) clearTimeout(binReportTimer.current);
      binReportTimer.current = setTimeout(() => setBinReportError(''), 6000);
    } finally {
      setBinReportLoading(false);
    }
  };

  const todayEntries = entries.filter(e => e.date === getNow().date);
  const currentBinMatch = binNumber ? bins.find(b => b.binNumber === binNumber.trim()) : null;

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
            { step: '4', icon: '✏️', label: 'Wpisz obszar + wagę' },
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
              {/* Area */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Obszar <span className="text-red-500">*</span>
                </label>
                <select
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-800 transition focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="">— Wybierz obszar —</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nr klasyfikacji odpadu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={classificationNumber}
                    onChange={e => setClassificationNumber(e.target.value)}
                    placeholder="np. 17.03.04"
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 transition focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nr pojemnika <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={binNumber}
                      onChange={e => handleBinNumberChange(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 transition focus:border-blue-500 focus:bg-white focus:outline-none appearance-none"
                    >
                      <option value="">— Wybierz pojemnik —</option>
                      {bins.map(b => (
                        <option key={b.id} value={b.binNumber}>
                          {b.binNumber} — {b.classificationCode}{b.description ? ` — ${b.description}` : ''}
                        </option>
                      ))}
                    </select>
                    {binNumber && bins.find(b => b.binNumber === binNumber) && (
                      <div className="mt-1 text-xs text-emerald-600">
                        ✓ Rozpoznany: {bins.find(b => b.binNumber === binNumber)?.description}
                      </div>
                    )}
                    {binNumber && !bins.find(b => b.binNumber === binNumber) && !binsLoading && (
                      <div className="mt-1 text-xs text-amber-600">
                        ⚠️ Nieznany pojemnik — wpisz ręcznie w polu poniżej lub dodaj go w Panelu Admina
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Przyczyna odpadów</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
              System NIE służy do oceny operatorów. Celem jest wykrycie awarii, nie wskazywanie winnych.
            </p>
          </div>
        </div>
      </div>

      {/* FULL BIN REPORT BUTTON */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-orange-800">🗑️ Pojemnik pełny?</h3>
            <p className="text-xs text-orange-600 mt-1">
              Jeśli pojemnik jest już pełny — zgłoś to. Magazynier dostanie powiadomienie na Slack.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={fullBinReason}
              onChange={e => setFullBinReason(e.target.value as WasteReason)}
              className="rounded-xl border-2 border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-orange-400 focus:outline-none"
            >
              <option value="procesowy">⬜ Procesowy</option>
              <option value="awaria">🔴 Awaria</option>
            </select>
            <button
              onClick={handleReportFullBin}
              disabled={binReportLoading}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
            >
              {binReportLoading ? '⏳...' : '🚨 Zgłoś pełny pojemnik'}
            </button>
          </div>
        </div>
        {binReportSuccess && (
          <div className="mt-3 rounded-xl bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700 border border-emerald-200">
            ✅ Zgłoszenie wysłane! Magazynier został powiadomiony.
          </div>
        )}
        {binReportError && (
          <div className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-xs font-semibold text-red-700 border border-red-200">
            ⚠️ {binReportError}
          </div>
        )}
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
              const r = REASONS[entry.reason] ?? UNKNOWN_REASON;
              return (
                <div key={entry.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50">
                  <span className="text-xl">{r.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{entry.area}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.bg} ${r.color} ${r.border} border`}>
                        {r.label}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Klasyfikacja: <strong>{entry.classificationNumber}</strong></span>
                      <span>Pojemnik: <strong>{entry.binNumber}</strong></span>
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