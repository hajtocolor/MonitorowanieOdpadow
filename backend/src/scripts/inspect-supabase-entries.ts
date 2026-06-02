import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');

dotenv.config({ path: path.resolve(repoRoot, '.env.local') });
dotenv.config({ path: path.resolve(repoRoot, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Brak konfiguracji Supabase w .env.local/.env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function tryColumn(columnName: string) {
  const { data, error } = await supabase
    .from('entries')
    .select(columnName)
    .limit(1);

  return { columnName, success: !error, error: error?.message, data };
}

async function main() {
  const candidates = [
    'id',
    'machineId',
    'machine_id',
    'machineid',
    'machine',
    'weightKg',
    'weight_kg',
    'weight',
    'date',
    'time',
    'reason',
    'comment',
    'createdAt',
    'created_at',
  ];

  for (const candidate of candidates) {
    const result = await tryColumn(candidate);
    console.log(result);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});