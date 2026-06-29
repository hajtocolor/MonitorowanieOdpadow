import { useState } from 'react';

const PRESETS = [
  { label: '7 dni', days: 7 },
  { label: '14 dni', days: 14 },
  { label: '30 dni', days: 30 },
];

interface Props {
  value: number;
  onChange: (days: number) => void;
}

export default function PeriodFilter({ value, onChange }: Props) {
  const [customDays, setCustomDays] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const isCustom = !PRESETS.some(p => p.days === value);

  const handleCustomSubmit = () => {
    const parsed = parseInt(customDays, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 365) {
      onChange(parsed);
      setShowCustom(false);
      setCustomDays('');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map(p => (
        <button
          key={p.days}
          onClick={() => { onChange(p.days); setShowCustom(false); }}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            value === p.days && !isCustom
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {p.label}
        </button>
      ))}
      <button
        onClick={() => { setShowCustom(!showCustom); if (!showCustom) onChange(-1); }}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
          isCustom
            ? 'bg-indigo-600 text-white shadow'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        Niestandardowy
      </button>
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="365"
            value={customDays}
            onChange={e => setCustomDays(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit(); }}
            placeholder="liczba dni"
            className="w-28 rounded-xl border-2 border-indigo-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={handleCustomSubmit}
            className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}