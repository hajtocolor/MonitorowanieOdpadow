import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..', '..');

dotenv.config({ path: path.resolve(rootDir, '.env.local') });
dotenv.config({ path: path.resolve(rootDir, '.env') });

type WasteEntryRow = {
  id: string;
  date: string;
  time: string;
  machineId: string;
  reason: string;
  weightKg: number;
  comment: string | null;
  createdAt: string;
};

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Brak konfiguracji Supabase: ustaw SUPABASE_URL oraz SUPABASE_SERVICE_ROLE_KEY w .env.local lub .env');
}

const sqlitePath = process.argv[2] || process.env.SQLITE_PATH || path.resolve(rootDir, 'data', 'waste.db');
if (!sqlitePath) {
  throw new Error('Podaj ścieżkę do pliku SQLite jako pierwszy argument lub ustaw SQLITE_PATH.');
}

if (!fs.existsSync(sqlitePath)) {
  throw new Error(`Nie znaleziono pliku SQLite: ${sqlitePath}`);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const sqlite = new Database(sqlitePath, { readonly: true });

async function main() {
  console.log(`Łączenie z lokalnym SQLite: ${sqlitePath}`);
  console.log(`Łączenie z Supabase: ${SUPABASE_URL}`);

  const rows = sqlite
    .prepare('SELECT id, date, time, machineId, reason, weightKg, comment, createdAt FROM entries')
    .all() as WasteEntryRow[];

  if (!rows.length) {
    console.log('Brak wpisów do migracji w tabeli entries.');
    process.exit(0);
  }

  const batchSize = 50;
  let totalMigrated = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    console.log(`Migracja wpisów ${i + 1}-${Math.min(i + batchSize, rows.length)}...`);

    const { error } = await supabase
      .from('entries')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error('Błąd Supabase podczas migracji:', error.message);
      process.exit(1);
    }

    totalMigrated += chunk.length;
  }

  console.log(`Migracja zakończona. Przeniesiono ${totalMigrated} wpisów.`);
  process.exit(0);
}

main().catch(error => {
  console.error('Błąd podczas migracji:', error);
  process.exit(1);
});
