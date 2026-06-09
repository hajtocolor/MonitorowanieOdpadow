-- SQL do wykonania w SQL Editor w projekcie Supabase
-- Tworzy tabelę bin_requests dla zgłoszeń pełnych pojemników

CREATE TABLE IF NOT EXISTS bin_requests (
  id TEXT PRIMARY KEY,
  bin_number TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('awaria', 'blad_operatora', 'procesowy')),
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- Index dla szybkiego wyszukiwania otwartych zgłoszeń
CREATE INDEX IF NOT EXISTS idx_bin_requests_resolved_at ON bin_requests(resolved_at);

-- Row Level Security (RLS) — wyłączone, backend używa service_role key
ALTER TABLE bin_requests DISABLE ROW LEVEL SECURITY;