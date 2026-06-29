-- Tabela obszarów (ustawienia - zarządzana przez Panel Admina)
CREATE TABLE IF NOT EXISTS areas (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wstaw domyślne obszary
INSERT INTO areas (id, label) VALUES
('VSP', 'VSP'),
('DRUKARNIA_HP', 'Drukarnia HP'),
('NORITSU', 'Noritsu'),
('INTROFUN', 'Introfun')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label;

-- Row Level Security — wyłączone, backend używa service_role key
ALTER TABLE areas DISABLE ROW LEVEL SECURITY;