import { useState } from 'react';
import { REASONS, WasteReason } from '../types';

const QR_BINS = [
  {
    reason: 'awaria' as WasteReason,
    title: 'Pojemnik CZERWONY',
    subtitle: 'Awaria maszyny',
    bgClass: 'bg-red-500',
    lightBg: 'bg-red-50',
    border: 'border-red-300',
    textClass: 'text-red-700',
    qrBg: '#ef4444',
    instructions: [
      'Zważ odpad na wadze przemysłowej',
      'Wrzuć do CZERWONEGO pojemnika',
      'Zeskanuj ten kod QR',
      'Wpisz TYLKO: numer maszyny + wagę',
    ],
  },
  {
    reason: 'blad_operatora' as WasteReason,
    title: 'Pojemnik ŻÓŁTY',
    subtitle: 'Błąd operatora',
    bgClass: 'bg-yellow-400',
    lightBg: 'bg-yellow-50',
    border: 'border-yellow-300',
    textClass: 'text-yellow-700',
    qrBg: '#eab308',
    instructions: [
      'Zważ odpad na wadze przemysłowej',
      'Wrzuć do ŻÓŁTEGO pojemnika',
      'Zeskanuj ten kod QR',
      'Wpisz TYLKO: numer maszyny + wagę',
    ],
  },
  {
    reason: 'procesowy' as WasteReason,
    title: 'Pojemnik SZARY',
    subtitle: 'Normalny odpad procesowy',
    bgClass: 'bg-slate-400',
    lightBg: 'bg-slate-50',
    border: 'border-slate-300',
    textClass: 'text-slate-600',
    qrBg: '#94a3b8',
    instructions: [
      'Zważ odpad na wadze przemysłowej',
      'Wrzuć do SZAREGO pojemnika',
      'Zeskanuj ten kod QR',
      'Wpisz TYLKO: numer maszyny + wagę',
    ],
  },
];

// Simple QR-code-like SVG placeholder (visual only - represents where a real QR would go)
function QRPlaceholder({ color, label }: { color: string; label: string }) {
  const size = 120;
  const cell = size / 12;
  // Generate a deterministic pseudo-QR pattern based on label
  const pattern = Array.from({ length: 12 }, (_, row) =>
    Array.from({ length: 12 }, (_, col) => {
      // Corner squares
      if ((row < 3 && col < 3) || (row < 3 && col > 8) || (row > 8 && col < 3)) return true;
      if ((row === 3 && col < 3) || (row === 3 && col > 8) || (row === 3 && col < 3)) return false;
      // Data area - deterministic hash
      const code = label.charCodeAt((row * 12 + col) % label.length);
      return (row * 7 + col * 11 + code) % 3 !== 0;
    })
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect width={size} height={size} fill="white" rx={6} />
      {pattern.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell - 1}
              height={cell - 1}
              fill={color}
              rx={1}
            />
          ) : null
        )
      )}
      {/* Finder patterns (corners) */}
      {[[0, 0], [0, 9], [9, 0]].map(([cr, cc]) => (
        <g key={`fp-${cr}-${cc}`}>
          <rect x={cc * cell} y={cr * cell} width={3 * cell} height={3 * cell} fill={color} rx={2} />
          <rect x={cc * cell + 3} y={cr * cell + 3} width={3 * cell - 6} height={3 * cell - 6} fill="white" rx={1} />
          <rect x={cc * cell + 6} y={cr * cell + 6} width={3 * cell - 12} height={3 * cell - 12} fill={color} rx={1} />
        </g>
      ))}
    </svg>
  );
}

export default function QRTab() {
  const [selectedBin, setSelectedBin] = useState<number | null>(null);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:5173';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold">🚀 Faza 2 – Kody QR na pojemnikach</h2>
            <p className="mt-1 text-indigo-100 text-sm">
              Wdrożenie po 2 tygodniach stabilnej pracy systemu. Operator skanuje → wpisuje tylko wagę → gotowe.
            </p>
          </div>
          <div className="rounded-xl bg-white/20 px-3 py-1.5 text-sm font-semibold">
            Za 0 zł
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: '⏱️', title: '< 30 sekund', desc: 'Czas na jedno zgłoszenie' },
            { icon: '📱', title: 'Tylko smartfon', desc: 'Bez komputera, bez Excela' },
            { icon: '🎯', title: '100% automatyczne', desc: 'Dane trafiają do systemu natychmiast' },
          ].map(item => (
            <div key={item.title} className="rounded-xl bg-white/10 p-3">
              <div className="text-2xl">{item.icon}</div>
              <div className="font-bold text-sm mt-1">{item.title}</div>
              <div className="text-xs text-indigo-200">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bin cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {QR_BINS.map((bin, idx) => {
          const r = REASONS[bin.reason];
          return (
            <div
              key={bin.reason}
              className={`rounded-2xl border-2 ${bin.border} ${bin.lightBg} p-5 cursor-pointer transition hover:shadow-md ${selectedBin === idx ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
              onClick={() => setSelectedBin(prev => prev === idx ? null : idx)}
            >
              {/* Bin visual */}
              <div className={`mx-auto mb-4 h-20 w-16 rounded-t-lg ${bin.bgClass} relative shadow-lg flex items-end justify-center pb-2`}>
                <span className="text-white text-2xl font-black opacity-90">{r.emoji}</span>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-3 w-14 rounded-t-sm bg-white/30"></div>
              </div>

              <h3 className={`text-center text-sm font-black ${bin.textClass}`}>{bin.title}</h3>
              <p className="text-center text-xs text-slate-500 mt-0.5">{bin.subtitle}</p>

              {/* QR placeholder */}
              <div className="mt-4 flex justify-center">
                <div className="rounded-xl border-2 border-dashed border-slate-300 p-3 bg-white">
                  <QRPlaceholder color={bin.qrBg} label={bin.reason} />
                  <p className="mt-2 text-center text-xs text-slate-400">Przykładowy QR</p>
                </div>
              </div>

              <button className={`mt-3 w-full rounded-xl py-2 text-xs font-bold text-white ${bin.bgClass} opacity-80 hover:opacity-100 transition`}>
                🖨️ Drukuj kod dla tego pojemnika
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected bin instructions */}
      {selectedBin !== null && (
        <div className={`rounded-2xl border-2 ${QR_BINS[selectedBin].border} ${QR_BINS[selectedBin].lightBg} p-6`}>
          <h3 className={`text-base font-bold ${QR_BINS[selectedBin].textClass} mb-4`}>
            📋 Instrukcja dla pojemnika: {QR_BINS[selectedBin].title}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {QR_BINS[selectedBin].instructions.map((step, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-white/70 p-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${QR_BINS[selectedBin].bgClass} text-white text-xs font-bold`}>
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation guide */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">🛠️ Jak wdrożyć kody QR (instrukcja krok po kroku)</h3>
        <div className="space-y-3">
          {[
            {
              step: '1',
              title: 'Wygeneruj kody QR',
              desc: 'Użyj darmowego generatora QR (np. qr-code-generator.com). Każdy kod powinien otwierać ten system z parametrem określającym pojemnik.',
              code: `${currentUrl}?bin=awaria`,
            },
            {
              step: '2',
              title: 'Wydrukuj i zalaminuj',
              desc: 'Wydrukuj kody QR w formacie A5 lub A4. Zalaminuj plastikową folią – będą odporne na kurz i wilgoć w hali produkcyjnej.',
            },
            {
              step: '3',
              title: 'Przyklej do pojemników',
              desc: 'Przyklej kod na boku pojemnika na wysokości wzroku. Upewnij się, że jest dobrze oświetlony – aparat telefonu musi go zobaczyć.',
            },
            {
              step: '4',
              title: 'Przetestuj z operatorami',
              desc: 'Przed oficjalnym uruchomieniem przetestuj z 2-3 operatorami. Cały proces (ważenie → wyrzucenie → skan → wpisanie) powinien zająć max 30 sekund.',
            },
          ].map(item => (
            <div key={item.step} className="flex gap-4 rounded-xl bg-slate-50 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">
                {item.step}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                {item.code && (
                  <code className="mt-2 block text-xs bg-slate-800 text-emerald-400 rounded-lg px-3 py-2 break-all">
                    {item.code}
                  </code>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Week report */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-2">📧 Automatyczny raport tygodniowy</h3>
        <p className="text-sm text-slate-500 mb-4">
          Drugi element Fazy 2 – kierownik produkcji dostaje email z podsumowaniem co tydzień. Konfiguracja jednorazowa.
        </p>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Przykładowa treść emaila</p>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-mono text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">📊 Raport odpadów – tydzień 23/2025</p>
            <p className="text-slate-400">───────────────────────────</p>
            <p>Łącznie: <strong>245.3 kg</strong> w 47 zgłoszeniach</p>
            <p>🟥 Awarie: 89.1 kg (36%)</p>
            <p>🟨 Błędy op.: 67.4 kg (27%)</p>
            <p>⬜ Procesowy: 88.8 kg (36%)</p>
            <p className="text-slate-400">───────────────────────────</p>
            <p>⚠️ Top problem: M07 – 71.2 kg (29% całości)</p>
            <p className="text-slate-400 text-xs">Raport wygenerowany automatycznie przez WasteTrack</p>
          </div>
        </div>
      </div>
    </div>
  );
}
