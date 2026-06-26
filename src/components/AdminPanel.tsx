import { useState, useEffect } from 'react';
import { Bin } from '../types';
import { getBins, createBin, deleteBin, getMachines, createMachine, deleteMachine } from '../api';

export default function AdminPanel() {
  // === BINS STATE ===
  const [bins, setBins] = useState<Bin[]>([]);
  const [binsLoading, setBinsLoading] = useState(true);
  const [newBinNumber, setNewBinNumber] = useState('');
  const [newBinClassCode, setNewBinClassCode] = useState('');
  const [newBinDesc, setNewBinDesc] = useState('');
  const [binError, setBinError] = useState('');
  const [binSuccess, setBinSuccess] = useState('');

  // === MACHINES STATE ===
  const [machines, setMachines] = useState<{ id: string; label: string }[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(true);
  const [newMachineId, setNewMachineId] = useState('');
  const [newMachineLabel, setNewMachineLabel] = useState('');
  const [machineError, setMachineError] = useState('');
  const [machineSuccess, setMachineSuccess] = useState('');

  const loadData = () => {
    getBins().then(d => { setBins(d ?? []); setBinsLoading(false); }).catch(() => setBinsLoading(false));
    getMachines().then(d => { setMachines(d ?? []); setMachinesLoading(false); }).catch(() => setMachinesLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  // === BINS HANDLERS ===
  const handleAddBin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBinError(''); setBinSuccess('');
    try {
      await createBin({
        binNumber: newBinNumber.trim(),
        classificationCode: newBinClassCode.trim(),
        description: newBinDesc.trim(),
      });
      setNewBinNumber(''); setNewBinClassCode(''); setNewBinDesc('');
      setBinSuccess('✅ Pojemnik dodany');
      loadData();
    } catch (err) {
      setBinError(err instanceof Error ? err.message : 'Błąd');
    }
  };

  const handleDeleteBin = async (id: string) => {
    if (!window.confirm('Usunąć ten pojemnik?')) return;
    try {
      await deleteBin(id);
      loadData();
    } catch (err) {
      setBinError(err instanceof Error ? err.message : 'Błąd');
    }
  };

  // === MACHINES HANDLERS ===
  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    setMachineError(''); setMachineSuccess('');
    try {
      await createMachine({ id: newMachineId.trim().toUpperCase(), label: newMachineLabel.trim() });
      setNewMachineId(''); setNewMachineLabel('');
      setMachineSuccess('✅ Maszyna dodana');
      loadData();
    } catch (err) {
      setMachineError(err instanceof Error ? err.message : 'Błąd');
    }
  };

  const handleDeleteMachine = async (id: string) => {
    if (!window.confirm('Usunąć tę maszynę?')) return;
    try {
      await deleteMachine(id);
      loadData();
    } catch (err) {
      setMachineError(err instanceof Error ? err.message : 'Błąd');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-slate-800">🔧 Panel Administratora</h2>
      </div>

      {/* === POJEMNIKI === */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">🗑️ Zarządzanie pojemnikami</h3>

        {/* Dodawanie */}
        <form onSubmit={handleAddBin} className="mb-6 grid gap-3 sm:grid-cols-4">
          <input
            type="text" value={newBinNumber} onChange={e => setNewBinNumber(e.target.value)}
            placeholder="Nr pojemnika" required
            className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text" value={newBinClassCode} onChange={e => setNewBinClassCode(e.target.value)}
            placeholder="Kod klasyfikacji (np. 15 01 05)" required
            className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text" value={newBinDesc} onChange={e => setNewBinDesc(e.target.value)}
            placeholder="Opis (opcjonalnie)"
            className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition">
            + Dodaj pojemnik
          </button>
        </form>

        {binError && <div className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">⚠️ {binError}</div>}
        {binSuccess && <div className="mb-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700 border border-emerald-200">{binSuccess}</div>}

        {/* Lista */}
        {binsLoading ? (
          <p className="text-slate-400 text-sm">Ładowanie...</p>
        ) : bins.length === 0 ? (
          <p className="text-slate-400 text-sm">Brak zdefiniowanych pojemników.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="pb-2 pr-4">Nr</th>
                  <th className="pb-2 pr-4">Kod klasyfikacji</th>
                  <th className="pb-2 pr-4">Opis</th>
                  <th className="pb-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {bins.map(b => (
                  <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-medium">{b.binNumber}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{b.classificationCode}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{b.description}</td>
                    <td className="py-2.5">
                      <button onClick={() => handleDeleteBin(b.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">
                        ✕ Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === MASZYNY === */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">⚙️ Zarządzanie maszynami</h3>

        {/* Dodawanie */}
        <form onSubmit={handleAddMachine} className="mb-6 grid gap-3 sm:grid-cols-4">
          <input
            type="text" value={newMachineId} onChange={e => setNewMachineId(e.target.value)}
            placeholder="ID maszyny (np. M12)" required
            className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text" value={newMachineLabel} onChange={e => setNewMachineLabel(e.target.value)}
            placeholder="Nazwa (np. HD 5)" required
            className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />
          <div></div>
          <button type="submit" className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition">
            + Dodaj maszynę
          </button>
        </form>

        {machineError && <div className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700 border border-red-200">⚠️ {machineError}</div>}
        {machineSuccess && <div className="mb-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700 border border-emerald-200">{machineSuccess}</div>}

        {/* Lista */}
        {machinesLoading ? (
          <p className="text-slate-400 text-sm">Ładowanie...</p>
        ) : machines.length === 0 ? (
          <p className="text-slate-400 text-sm">Brak zdefiniowanych maszyn.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="pb-2 pr-4">ID</th>
                  <th className="pb-2 pr-4">Nazwa</th>
                  <th className="pb-2">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {machines.map(m => (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-medium">{m.id}</td>
                    <td className="py-2.5 pr-4 text-slate-600">{m.label}</td>
                    <td className="py-2.5">
                      <button onClick={() => handleDeleteMachine(m.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">
                        ✕ Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
        <p className="text-xs text-amber-700 font-medium">⚠️ Zmiany w maszynach i pojemnikach są zapisywane w bazie danych (Supabase). Nie wpływają na już istniejące wpisy w historii.</p>
      </div>
    </div>
  );
}