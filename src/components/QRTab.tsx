import { useState, useCallback, useEffect } from 'react';
import { REASONS, WasteReason, AREAS } from '../types';
import { getAreas } from '../api';
import QRCode from 'qrcode';

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
    classificationNumber: '12.01.01',
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
    classificationNumber: '18.02.05',
  },
];

interface QRCodeImageProps {
  url: string;
  label: string;
}

function QRCodeImage({ url, label }: QRCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useCallback(() => {
    QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    }).then(setDataUrl).catch(() => {});
  }, [url]);

  // Generate QR on mount/url change
  if (!dataUrl) {
    QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    }).then(setDataUrl).catch(() => {});
  }

  if (!dataUrl) {
    return (
      <div className="flex items-center justify-center" style={{ width: 200, height: 200 }}>
        <span className="text-sm text-slate-400">Generowanie QR...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <img src={dataUrl} alt={`QR dla ${label}`} width={200} height={200} className="rounded-lg" />
      <p className="mt-2 text-xs text-slate-500 text-center break-all max-w-[220px]">{url}</p>
    </div>
  );
}

export default function QRTab() {
  const [areas, setAreas] = useState<{ id: string; label: string }[]>(AREAS);
  const [selectedArea, setSelectedArea] = useState(AREAS[0]?.id || 'VSP');
  const [selectedBin, setSelectedBin] = useState<number | null>(null);
  const bin = selectedBin !== null ? QR_BINS[selectedBin] : null;

  useEffect(() => {
    getAreas()
      .then(data => { if (data && data.length > 0) setAreas(data); })
      .catch(() => {});
  }, []);

  const appUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://monitorowanieodpadow.vercel.app';

  const generateQrUrl = (areaId: string, reason: WasteReason, classificationNumber: string, binNumber: string) => {
    const params = new URLSearchParams({
      area: areaId,
      reason,
      classificationNumber,
      binNumber,
    });
    return `${appUrl}?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold">🚀 Faza 2 – Kody QR na pojemnikach</h2>
            <p className="mt-1 text-indigo-100 text-sm">
              Operator skanuje → wpisuje tylko wagę → gotowe. Kody QR zawierają informacje o obszarze i pojemniku.
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

      {/* Area selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3">
          🏭 Wybierz obszar
        </h3>
        <div className="flex flex-wrap gap-2">
          {areas.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedArea(a.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition border-2 ${
                selectedArea === a.id
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bin cards with QR */}
      <div className="grid gap-4 sm:grid-cols-2">
        {QR_BINS.map((binItem, idx) => {
          const r = REASONS[binItem.reason];
          return (
            <div
              key={binItem.reason}
              className={`rounded-2xl border-2 ${binItem.border} ${binItem.lightBg} p-5 cursor-pointer transition hover:shadow-md ${selectedBin === idx ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
              onClick={() => setSelectedBin(prev => prev === idx ? null : idx)}
            >
              {/* Bin visual */}
              <div className={`mx-auto mb-4 h-20 w-16 rounded-t-lg ${binItem.bgClass} relative shadow-lg flex items-end justify-center pb-2`}>
                <span className="text-white text-2xl font-black opacity-90">{r.emoji}</span>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-3 w-14 rounded-t-sm bg-white/30"></div>
              </div>

              <h3 className={`text-center text-sm font-black ${binItem.textClass}`}>{binItem.title}</h3>
              <p className="text-center text-xs text-slate-500 mt-0.5">{binItem.subtitle}</p>

              {/* QR code */}
              <div className="mt-4 flex justify-center">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <QRCodeImage
                    url={generateQrUrl(
                      selectedArea,
                      binItem.reason,
                      binItem.classificationNumber,
                      `${idx + 1}`
                    )}
                    label={`${binItem.title} - ${selectedArea}`}
                  />
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const url = generateQrUrl(
                    selectedArea,
                    binItem.reason,
                    binItem.classificationNumber,
                    `${idx + 1}`
                  );
                  QRCode.toDataURL(url, { width: 400, margin: 2 }).then(dataUrl => {
                    const link = document.createElement('a');
                    link.download = `qr-${binItem.reason}-${selectedArea}.png`;
                    link.href = dataUrl;
                    link.click();
                  });
                }}
                className={`mt-3 w-full rounded-xl py-2 text-xs font-bold text-white ${binItem.bgClass} opacity-80 hover:opacity-100 transition`}
              >
                🖨️ Pobierz QR
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected bin info */}
      {selectedBin !== null && bin && (
        <div className={`rounded-2xl border-2 ${bin.border} ${bin.lightBg} p-6`}>
          <h3 className={`text-base font-bold ${bin.textClass} mb-4`}>
            📋 Podgląd danych w QR dla: {bin.title}
          </h3>
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-xl bg-white/70 p-3">
              <span className="text-sm text-slate-600">Obszar</span>
              <span className="font-bold text-slate-800">{selectedArea}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/70 p-3">
              <span className="text-sm text-slate-600">Przyczyna</span>
              <span className="font-bold text-slate-800">{REASONS[bin.reason].label}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/70 p-3">
              <span className="text-sm text-slate-600">Nr klasyfikacji</span>
              <span className="font-bold text-slate-800">{bin.classificationNumber}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/70 p-3">
              <span className="text-sm text-slate-600">Nr pojemnika</span>
              <span className="font-bold text-slate-800">{selectedBin + 1}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 p-3">
              <span className="text-sm text-amber-700">Waga (kg)</span>
              <span className="font-bold text-amber-700">✏️ Wpisuje operator ręcznie</span>
            </div>
          </div>
        </div>
      )}

      {/* Implementation guide */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">🛠️ Jak wdrożyć kody QR</h3>
        <div className="space-y-3">
          {[
            {
              step: '1',
              title: 'Wybierz obszar i pojemnik',
              desc: 'Wybierz obszar powyżej, a następnie kliknij na pojemnik. Pojawi się gotowy kod QR.',
            },
            {
              step: '2',
              title: 'Pobierz i wydrukuj',
              desc: 'Kliknij "Pobierz QR" – zapisze się jako obrazek PNG. Wydrukuj w formacie A5 lub A4, zalaminuj.',
            },
            {
              step: '3',
              title: 'Przyklej do pojemnika',
              desc: 'Przyklej kod na boku pojemnika na wysokości wzroku. Upewnij się, że jest dobrze oświetlony.',
            },
            {
              step: '4',
              title: 'Operator skanuje i wpisuje wagę',
              desc: 'Po zeskanowaniu QR telefon otworzy formularz z wypełnionymi danymi. Operator wpisuje tylko wagę i zapisuje.',
            },
          ].map(item => (
            <div key={item.step} className="flex gap-4 rounded-xl bg-slate-50 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">
                {item.step}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}