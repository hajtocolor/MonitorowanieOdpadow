import { useState, useEffect } from 'react';
import { BinRequest, REASONS } from '../types';
import { getBinRequests, resolveBinRequest } from '../api';

export default function BinRequestsTab() {
  const [requests, setRequests] = useState<BinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    getBinRequests()
      .then(data => {
        setRequests(data ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError('Nie udało się pobrać zgłoszeń');
        setLoading(false);
      });
  }, []);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await resolveBinRequest(id);
      setRequests(prev =>
        prev.map(r => (r.id === id ? { ...r, resolvedAt: new Date().toISOString(), resolvedBy: 'admin' } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd');
    } finally {
      setResolvingId(null);
    }
  };

  const openRequests = requests.filter(r => !r.resolvedAt);
  const resolvedRequests = requests.filter(r => r.resolvedAt);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400">Ładowanie zgłoszeń...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">🗑️ Zgłoszenia wymiany pojemników</h2>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
          {openRequests.length} aktywnych
        </span>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* OPEN REQUESTS */}
      <div className="rounded-2xl border border-orange-200 bg-white shadow-sm">
        <div className="border-b border-orange-100 bg-orange-50 px-6 py-3">
          <h3 className="text-sm font-bold text-orange-800">
            🟡 Oczekujące ({openRequests.length})
          </h3>
        </div>
        {openRequests.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <div className="text-4xl mb-2">✅</div>
            <p>Brak oczekujących zgłoszeń. Wszystkie pojemniki są odebrane.</p>
          </div>
        ) : (
          <div className="divide-y divide-orange-50">
            {openRequests.map(req => {
              const reasonInfo = REASONS[req.reason as keyof typeof REASONS];
              return (
                <div key={req.id} className="flex items-center gap-4 px-6 py-4 hover:bg-orange-50/50">
                  <span className="text-2xl">{reasonInfo?.emoji || '⬜'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">Pojemnik {req.binNumber}</span>
                      {reasonInfo && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${reasonInfo.bg} ${reasonInfo.color} ${reasonInfo.border} border`}>
                          {reasonInfo.label}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Zgłoszony z: <strong>{req.requestedBy}</strong></span>
                      <span>· {new Date(req.requestedAt).toLocaleString('pl-PL')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolve(req.id)}
                    disabled={resolvingId === req.id}
                    className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition disabled:opacity-50"
                  >
                    {resolvingId === req.id ? '⏳...' : '✓ Odebrane'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RESOLVED REQUESTS */}
      {resolvedRequests.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-3">
            <h3 className="text-sm font-bold text-slate-600">
              ✅ Zrealizowane ({resolvedRequests.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {resolvedRequests.slice(0, 20).map(req => {
              const reasonInfo = REASONS[req.reason as keyof typeof REASONS];
              return (
                <div key={req.id} className="flex items-center gap-4 px-6 py-3 text-slate-400">
                  <span className="text-lg">{reasonInfo?.emoji || '⬜'}</span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-600">Pojemnik {req.binNumber}</span>
                    <span className="text-xs ml-2">
                      · {new Date(req.requestedAt).toLocaleString('pl-PL')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    Odebrane: {req.resolvedAt ? new Date(req.resolvedAt).toLocaleString('pl-PL') : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-slate-100 px-5 py-4">
        <p className="text-xs text-slate-500">
          💡 Operator zgłasza pełny pojemnik → zgłoszenie zapisuje się tutaj → magazynier odbiera i klika "Odebrane" → Teams dostaje info o nowym zgłoszeniu.
        </p>
      </div>
    </div>
  );
}