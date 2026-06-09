import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.resolve(repoRoot, '.env.local') });
dotenv.config({ path: path.resolve(repoRoot, '.env') });
// === CONFIG FROM ENV ===
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const WORKER_PASSWORD = process.env.WORKER_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Brak konfiguracji Supabase: ustaw SUPABASE_URL oraz SUPABASE_SERVICE_ROLE_KEY');
}
if (!JWT_SECRET) {
  throw new Error('Ustaw JWT_SECRET w zmiennych środowiskowych');
}
if (!ADMIN_PASSWORD || !WORKER_PASSWORD) {
  throw new Error('Ustaw ADMIN_PASSWORD i WORKER_PASSWORD w zmiennych środowiskowych');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();

// Security headers (helmet)
app.use(helmet({
  contentSecurityPolicy: false, // disabled for SPA to work
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Strict CORS - only allow specific origins in production
const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin) {
  console.warn('OSTRZEŻENIE: CORS_ORIGIN nie jest ustawione. Backend będzie dostępny dla wszystkich originów (tylko do dewelopmentu!)');
}
app.use(cors({
  origin: corsOrigin || '*',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting - protect against abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuta
  max: 100, // max 100 requestów na minutę
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zbyt wiele zapytań. Spróbuj ponownie za minutę.' },
});
app.use(limiter);

// === JWT MIDDLEWARE ===
interface JwtPayload {
  role: 'admin' | 'worker';
}

function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Brak tokenu autoryzacyjnego' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token wygasł lub jest nieprawidłowy' });
  }
}

function requireRole(allowed: Array<'admin' | 'worker'>) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as JwtPayload | undefined;
    if (!user || !allowed.includes(user.role)) {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    next();
  };
}

// === PUBLIC ENDPOINTS ===

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/login', (req, res) => {
  const { role, password } = req.body;

  if (role === 'admin' && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ role: 'admin', token });
  }

  if (role === 'worker' && password === WORKER_PASSWORD) {
    const token = jwt.sign({ role: 'worker' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ role: 'worker', token });
  }

  return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
});

// === PROTECTED ENDPOINTS (require auth) ===

app.get('/api/entries', authenticateToken, async (_req, res) => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data ?? []);
});

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

app.post('/api/entries', authenticateToken, async (req, res) => {
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

app.delete('/api/entries/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
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

app.delete('/api/entries', authenticateToken, requireRole(['admin']), async (req, res) => {
  // Require confirmation to prevent accidental deletion
  if (req.query.confirm !== 'true') {
    return res.status(400).json({ error: 'Wymagane potwierdzenie: dodaj ?confirm=true do zapytania' });
  }

  const { error } = await supabase.from('entries').delete().neq('id', '');
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Backend uruchomiony na porcie ${port}`);
});