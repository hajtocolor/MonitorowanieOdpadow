import { useState, useEffect, type FormEvent } from 'react';
import { useWasteStore } from './store';
import RegisterTab from './components/RegisterTab';
import DashboardTab from './components/DashboardTab';
import ReasonAnalysisTab from './components/ReasonAnalysisTab';
import MachineAnalysisTab from './components/MachineAnalysisTab';
import HistoryTab from './components/HistoryTab';
import QRTab from './components/QRTab';
import RulesTab from './components/RulesTab';
import DictionaryTab from './components/DictionaryTab';
import BinRequestsTab from './components/BinRequestsTab';
import AdminPanel from './components/AdminPanel';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { getStoredRole, login as apiLogin, logout as apiLogout } from './auth';
import type { UserRole } from './types';

type Tab = 'register' | 'dashboard' | 'reason' | 'machine' | 'history' | 'qr' | 'rules' | 'dictionary' | 'binrequests' | 'admin';

const TABS: Array<{ id: Tab; label: string; icon: string; desc: string }> = [
  { id: 'register', label: 'Rejestr', icon: '📝', desc: 'Wpisz odpad' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊', desc: 'Podsumowanie' },
  { id: 'reason', label: 'Przyczyny', icon: '🤖', desc: 'Analiza' },
  { id: 'machine', label: 'Maszyny', icon: '⚙️', desc: 'Ranking' },
  { id: 'history', label: 'Historia', icon: '📋', desc: 'Wszystkie wpisy' },
  { id: 'qr', label: 'QR Faza 2', icon: '🚀', desc: 'Kody QR' },
  { id: 'rules', label: 'Zasady', icon: '📜', desc: 'Instrukcja' },
  { id: 'dictionary', label: 'Słownik', icon: '📖', desc: 'Klasyfikacja odpadów' },
  { id: 'binrequests', label: 'Zgłoszenia', icon: '🗑️', desc: 'Wymiana pojemników' },
  { id: 'admin', label: 'Admin', icon: '🔧', desc: 'Zarządzanie' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('register');
  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loginRole, setLoginRole] = useState<UserRole>('worker');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const { entries, addEntry, deleteEntry, clearAll } = useWasteStore();

  useEffect(() => {
    setRole(getStoredRole());
  }, []);

  useEffect(() => {
    if (role === 'worker' && activeTab !== 'register') {
      setActiveTab('register');
    }
  }, [role, activeTab]);

  const visibleTabs = role === 'admin'
    ? TABS
    : role === 'worker'
      ? TABS.filter(tab => tab.id === 'register')
      : [];

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError('');

    const result = await apiLogin(loginRole, password);
    if (!result.success) {
      setLoginError(result.error || 'Nieprawidłowy login lub hasło.');
      return;
    }

    setPassword('');
    setRole(loginRole);
    setActiveTab('register');
  };

  const logout = () => {
    apiLogout();
    setRole(null);
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayKg = entries.filter(e => e.date === todayStr).reduce((s, e) => s + e.weightKg, 0);
  const todayCount = entries.filter(e => e.date === todayStr).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* TOP BAR */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow">
                <span className="text-lg">🏭</span>
              </div>
              <div>
                <div className="text-sm font-black text-slate-800 leading-tight">WasteTrack</div>
                <div className="text-xs text-slate-400 leading-tight">System śledzenia odpadów</div>
              </div>
            </div>

            {/* Today stats */}
            <div className="hidden sm:flex items-center gap-3 ml-4">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5">
                <span className="text-xs font-semibold text-slate-500">Dziś:</span>
                <span className="text-sm font-black text-slate-800">{todayKg.toFixed(1)} kg</span>
                <span className="text-xs text-slate-400">· {todayCount} wpisów</span>
              </div>
              <div className="text-xs text-slate-400">
                {format(new Date(), 'EEEE, d MMMM yyyy', { locale: pl })}
              </div>
            </div>

            <div className="flex-1" />

            {role ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  {role === 'admin' ? 'Admin' : 'Pracownik'}
                </div>
                <button
                  onClick={logout}
                  className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Wyloguj
                </button>
              </div>
            ) : null}

            {role ? (
              <button
                onClick={() => { setActiveTab('register'); setMenuOpen(false); }}
                className="hidden sm:flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition shadow-sm"
              >
                + Nowy wpis
              </button>
            ) : null}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Desktop nav tabs */}
          {role ? (
            <div className="hidden sm:flex gap-0.5 pb-0">
              {visibleTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Mobile menu */}
        {menuOpen && role && (
          <div className="sm:hidden border-t border-slate-100 bg-white">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <div>
                  <div className="font-semibold text-sm">{tab.label}</div>
                  <div className="text-xs text-slate-400">{tab.desc}</div>
                </div>
              </button>
            ))}
            <div className="px-4 py-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">Dziś: <strong>{todayKg.toFixed(1)} kg</strong> · {todayCount} wpisów</div>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
        {!role ? (
          <div className="mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-slate-900 mb-3">WasteTrack</h1>
            <p className="mb-6 text-slate-600">Zaloguj się hasłem. Pracownik ma dostęp tylko do rejestru, a administrator do całego systemu.</p>
              <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Rola użytkownika</label>
                <select
                  value={loginRole}
                  onChange={e => setLoginRole(e.target.value as UserRole)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
                >
                  <option value="admin">Administrator</option>
                  <option value="worker">Pracownik</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Hasło</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Wprowadź hasło"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {loginError ? (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 border border-red-200">
                  {loginError}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:from-indigo-700 hover:to-violet-700"
              >
                Zaloguj się
              </button>
            </form>
          </div>
        ) : (
          <>
            {activeTab === 'register' && (
              <RegisterTab entries={entries} addEntry={addEntry} deleteEntry={deleteEntry} canDelete={role === 'admin'} />
            )}
            {activeTab === 'dashboard' && (
              <DashboardTab entries={entries} />
            )}
            {activeTab === 'reason' && (
              <ReasonAnalysisTab entries={entries} />
            )}
            {activeTab === 'machine' && (
              <MachineAnalysisTab entries={entries} />
            )}
            {activeTab === 'history' && (
              <HistoryTab entries={entries} deleteEntry={deleteEntry} clearAll={clearAll} />
            )}
            {activeTab === 'qr' && (
              <QRTab />
            )}
            {activeTab === 'rules' && (
              <RulesTab />
            )}
            {activeTab === 'dictionary' && (
              <DictionaryTab />
            )}
            {activeTab === 'binrequests' && (
              <BinRequestsTab />
            )}
            {activeTab === 'admin' && (
              <AdminPanel />
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>🏭 WasteTrack – System śledzenia odpadów fabrycznych · Dane lokalnie lub na backendzie, gdy serwer jest dostępny</span>
          <span>Łącznie w bazie: <strong className="text-slate-600">{entries.length} wpisów</strong> · <strong className="text-slate-600">{entries.reduce((s, e) => s + e.weightKg, 0).toFixed(1)} kg</strong></span>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      {role ? (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
          <div className="grid grid-cols-4 divide-x divide-slate-100">
            {visibleTabs.slice(0, 4).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-2 transition ${
                  activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-xs font-medium mt-0.5">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
