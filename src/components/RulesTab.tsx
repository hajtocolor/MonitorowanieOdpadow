export default function RulesTab() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Golden rule */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white shadow-lg">
        <h2 className="text-xl font-black mb-2">⚠️ Złota zasada systemu</h2>
        <p className="text-lg font-bold">
          Nigdy nie używaj tego systemu do karania nikogo.
        </p>
        <p className="mt-2 text-amber-100 text-sm">
          Jeśli chociaż raz ukarzesz operatora za błąd który znalazłeś w tym rejestrze, od następnego dnia 100% wszystkich odpadów będzie wpisanych jako "awaria maszyny". System jest martwy.
        </p>
      </div>

      {/* Main rules */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">📜 Zasady bez których system NA PEWNO zawiedzie</h3>
        <div className="space-y-4">
          {[
            {
              icon: '❌',
              title: 'Nigdy nie karz za dane w rejestrze',
              desc: 'System zbiera dane o maszynach, nie o ludziach. Jeden wyjątek i system jest skończony w 24h.',
              bad: true,
            },
            {
              icon: '🚫',
              title: 'Nigdy nie dodawaj pola "imię operatora"',
              desc: 'Celem jest dowiedzieć się, że Maszyna 7 generuje 40% odpadów – nie że Janek zrobił błąd we wtorek.',
              bad: true,
            },
            {
              icon: '✅',
              title: 'Tolerancja wagi ±10% jest wystarczająca',
              desc: 'Celem jest znalezienie dużych problemów (maszyna generuje 3× więcej), a nie liczenie każdego grama. Nie wymagaj dokładności.',
              bad: false,
            },
            {
              icon: '📋',
              title: 'Raz dziennie – weryfikacja sumy kg',
              desc: 'Kierownik zmiany sprawdza czy suma wpisanych kg zgadza się mniej więcej z wagą pojemnika przy wywozie. Tolerancja ±15%.',
              bad: false,
            },
            {
              icon: '🎯',
              title: 'Maksimum 30 sekund na wpis',
              desc: 'Jeśli jakikolwiek krok trwa dłużej – uprość go natychmiast. System który jest wolny zostanie sabotowany.',
              bad: false,
            },
          ].map(rule => (
            <div key={rule.title} className={`flex gap-4 rounded-xl p-4 ${rule.bad ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
              <span className="text-2xl shrink-0">{rule.icon}</span>
              <div>
                <p className={`font-bold ${rule.bad ? 'text-red-800' : 'text-emerald-800'}`}>{rule.title}</p>
                <p className={`text-sm mt-1 ${rule.bad ? 'text-red-600' : 'text-emerald-700'}`}>{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Process */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-2">🔄 Proces dla operatora (4 kroki)</h3>
        <p className="text-sm text-slate-500 mb-4">
          Ta kolejność kroków ma ogromne znaczenie psychologiczne. Zwiększa prawdomówność danych o ~80%.
        </p>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-red-50 border border-red-200 p-3">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">❌ ZŁA kolejność</p>
            <div className="space-y-1 text-sm text-red-600">
              <p>1. Zważ odpad</p>
              <p>2. <strong>Wpisz</strong> do systemu</p>
              <p>3. Wyrzuć do pojemnika</p>
            </div>
            <p className="mt-2 text-xs text-red-500">Operator ma motyw żeby wpisać mniej niż faktycznie waży!</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">✅ DOBRA kolejność</p>
            <div className="space-y-1 text-sm text-emerald-700">
              <p>1. Zważ odpad</p>
              <p>2. <strong>Wyrzuć</strong> do pojemnika</p>
              <p>3. Wpisz do systemu</p>
            </div>
            <p className="mt-2 text-xs text-emerald-600">Odpad jest już w pojemniku – operatorowi obojętna jest waga!</p>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { n: '1', icon: '⚖️', text: 'Zważ odpad na wadze przemysłowej (tolerancja ±10%)' },
            { n: '2', icon: '🗑️', text: 'Wrzuć odpad do odpowiedniego kolorowego pojemnika' },
            { n: '3', icon: '📱', text: 'Otwórz system WasteTrack (lub zeskanuj kod QR)' },
            { n: '4', icon: '✏️', text: 'Wpisz tylko dwie rzeczy: numer maszyny i wagę → Zapisz' },
          ].map(step => (
            <div key={step.n} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white text-xs font-bold">{step.n}</span>
              <span className="text-lg">{step.icon}</span>
              <span className="text-sm text-slate-700">{step.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bin setup */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">🗑️ Konfiguracja fizyczna pojemników</h3>
        <p className="text-sm text-slate-500 mb-4">Instalacja jednorazowa. Trzy pojemniki obok siebie, jedna waga przed nimi.</p>
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          {[
            { color: 'bg-red-500', label: 'CZERWONY', sub: 'Awaria maszyny', emoji: '🟥' },
            { color: 'bg-yellow-400', label: 'ŻÓŁTY', sub: 'Błąd operatora', emoji: '🟨' },
            { color: 'bg-slate-300', label: 'SZARY', sub: 'Procesowy', emoji: '⬜' },
          ].map(bin => (
            <div key={bin.label} className="flex flex-col items-center gap-2">
              <div className={`h-24 w-20 rounded-t-xl ${bin.color} shadow-lg flex items-end justify-center pb-3 relative`}>
                <span className="text-3xl">{bin.emoji}</span>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-4 w-18 rounded-t-md bg-white/40 w-16"></div>
              </div>
              <p className="font-black text-sm text-slate-700">{bin.label}</p>
              <p className="text-xs text-slate-500">{bin.sub}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-slate-800 p-3 text-center">
          <span className="text-white text-sm font-semibold">⚖️ Waga przemysłowa – stoi na stałe przed pojemnikami</span>
        </div>
      </div>

      {/* Dashboard tabs guide */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">📊 Zakładki systemu</h3>
        <div className="space-y-3">
          {[
            { tab: '📝 Rejestr', desc: 'JEDYNA zakładka gdzie cokolwiek się wpisuje. Operator wpisuje maszynę i wagę – tyle.' },
            { tab: '📊 Dashboard', desc: 'Główne podsumowanie z wykresami. Aktualizuje się automatycznie po każdym wpisie.' },
            { tab: '🤖 Analiza – Przyczyny', desc: 'Podział odpadów na: awaria / błąd operatora / procesowy. Identyfikacja dominującego problemu.' },
            { tab: '⚙️ Analiza – Maszyny', desc: 'Ranking maszyn według kg odpadów. Kliknij maszynę aby zobaczyć szczegółowy wykres 7-dniowy.' },
            { tab: '📋 Historia', desc: 'Pełny rejestr z filtrowaniem i eksportem do CSV (compatible z Excel).' },
            { tab: '🚀 QR Faza 2', desc: 'Instrukcja wdrożenia kodów QR – opcjonalne usprawnienie po 2 tygodniach stabilnej pracy.' },
          ].map(item => (
            <div key={item.tab} className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="font-bold text-slate-700 text-sm shrink-0 w-44">{item.tab}</span>
              <span className="text-sm text-slate-500">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
