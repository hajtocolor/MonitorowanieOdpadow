import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.resolve(repoRoot, '.env.local') });
dotenv.config({ path: path.resolve(repoRoot, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Brak konfiguracji Supabase: ustaw SUPABASE_URL oraz SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

const CREDENTIALS: Record<'admin' | 'worker', string> = {
  admin: 'admin123',
  worker: 'worker123',
};

function getRole(req: express.Request): 'admin' | 'worker' | null {
  const raw = String(req.header('x-user-role') || '').toLowerCase();
  if (raw === 'admin' || raw === 'worker') {
    return raw;
  }
  return null;
}

function requireRole(allowed: Array<'admin' | 'worker'>) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const role = getRole(req);
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    next();
  };
}

function validateCredentials(role: string, password: string) {
  return (role === 'admin' || role === 'worker') && CREDENTIALS[role] === password;
}

function validateEntry(body: any) {
  const { id, date, time, machineId, classificationNumber, binNumber, reason, weightKg, comment, createdAt } = body;
  if (typeof date !== 'string' || !date) return 'Nieprawidłowa data';
  if (typeof time !== 'string' || !time) return 'Nieprawidłowa godzina';
  if (typeof machineId !== 'string' || !machineId) return 'Nieprawidłowy numer maszyny';
  if (typeof classificationNumber !== 'string' || !classificationNumber.trim()) return 'Nieprawidłowy numer klasyfikacji odpadu';
  if (typeof binNumber !== 'string' || !binNumber.trim()) return 'Nieprawidłowy numer pojemnika';
  if (typeof reason !== 'string' || !['awaria', 'blad_operatora', 'procesowy'].includes(reason)) return 'Nieprawidłowa przyczyna';
  if (typeof weightKg !== 'number' || Number.isNaN(weightKg) || weightKg <= 0) return 'Nieprawidłowa waga';
  if (comment !== undefined && typeof comment !== 'string') return 'Nieprawidłowy komentarz';
  if (typeof createdAt !== 'string' || !createdAt) return 'Nieprawidłowy czas utworzenia';
  if (id !== undefined && typeof id !== 'string') return 'Nieprawidłowe id';
  return null;
}

type WasteEntryRow = {
  id: string;
  date: string;
  time: string;
  machineId: string;
  classificationNumber: string;
  binNumber: string;
  reason: string;
  weightKg: number;
  comment: string | null;
  createdAt: string;
};

app.get('/api/entries', async (req, res) => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data ?? []);
});

app.post('/api/login', (req, res) => {
  const { role, password } = req.body;
  if (!validateCredentials(role, password)) {
    return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
  }
  res.json({ role });
});

app.post('/api/entries', async (req, res) => {
  const errorMessage = validateEntry(req.body);
  if (errorMessage) return res.status(400).json({ error: errorMessage });

  const entry: WasteEntryRow = {
    id:
      typeof req.body.id === 'string' && req.body.id.trim()
        ? req.body.id
        : `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: req.body.date,
    time: req.body.time,
    machineId: req.body.machineId,
    classificationNumber: req.body.classificationNumber,
    binNumber: req.body.binNumber,
    reason: req.body.reason,
    weightKg: req.body.weightKg,
    comment: req.body.comment ?? null,
    createdAt: req.body.createdAt,
  };

  const { data, error } = await supabase.from('entries').insert([entry]).select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data?.[0] ?? entry);
});

app.delete('/api/entries/:id', requireRole(['admin']), async (req, res) => {
  const { data, error } = await supabase
    .from('entries')
    .delete()
    .eq('id', req.params.id)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Nie znaleziono wpisu' });
  }

  res.status(204).send();
});

app.delete('/api/entries', requireRole(['admin']), async (req, res) => {
  const { error } = await supabase.from('entries').delete().neq('id', '');
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Backend uruchomiony na porcie ${port}`);
});
