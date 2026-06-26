-- Tabela maszyn (ustawienia - zarządzana przez Panel Admina)
CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wstaw domyślne maszyny (zgodne z obecnym MACHINES w types.ts)
INSERT INTO machines (id, label) VALUES
('M01', 'HD 1 (HP100K)'),
('M02', 'HD 2 (HP100K)'),
('M03', 'HD 3 (HP100K)'),
('M04', 'HD 4 (HP100K)'),
('M05', 'HM 1'),
('M06', 'HM 2'),
('M07', 'NORITSU'),
('M08', 'VSP'),
('M09', 'MASTER CUT 1'),
('M10', 'MASTER CUT 2'),
('M11', 'MASTER CUT 3')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label;

-- Row Level Security — wyłączone, backend używa service_role key
ALTER TABLE machines DISABLE ROW LEVEL SECURITY;