-- Tabela definicji pojemników
-- Uruchom to w SQL Editor w Supabase Dashboard
CREATE TABLE IF NOT EXISTS bins (
  id TEXT PRIMARY KEY,
  bin_number TEXT NOT NULL UNIQUE,
  classification_code TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  area_ids TEXT[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks dla szybkiego wyszukiwania po numerze pojemnika
CREATE INDEX IF NOT EXISTS idx_bins_bin_number ON bins (bin_number);

-- Wstaw dane (wszystkie pojemniki bez przypisania do obszaru)
INSERT INTO bins (id, bin_number, classification_code, description, area_ids) VALUES
('bin-0121A', '0121A', '15 01 05', 'Ścinki papieru zalaminowanego', NULL),
('bin-26', '26', '15 01 01', 'Pozostałości arkuszy tektury litej (szarej twardej) pod okładki do fotoksiążki', NULL),
('bin-27', '27', '15 01 05', 'Pozostałości arkuszy tektury z gąbką pod okładkę do fotoksiążki', NULL),
('bin-138', '138', '15 01 01', 'Tektura lita - formatki pod okładkę do fotoksiążki', NULL),
('bin-123', '123', '03 03 08', 'Całe bloki z fotoksiążek, pojedyńcze kartki urwane z tych bloków', NULL),
('bin-134', '134', '19 12 01', 'Ścinki papieru z docinania bloków do fotoksiążki', NULL),
('bin-136', '136', '15 01 05', 'Tektura lita lub tektura z gąbką oklejona zadrukowanym, zalaminowanym papierem (cała okładka)', NULL),
('bin-117', '117', '19 12 01', 'Ścinki papieru po wycięciu na gilotynie różne wielkości ścinek', NULL),
('bin-118', '118', '19 12 01', 'Ścinki papieru po wycięciu na gilotynie, różne wielkości ścinek', NULL),
('bin-119', '119', '19 12 01', 'Ścinki papieru po wycięciu na gilotynie, różne wielkości ścinek', NULL),
('bin-89', '89', '03 03 08', 'Całe arkusze papieru zadrukowane', NULL),
('bin-102', '102', '03 03 08', 'Arkusze papieru zadrukowane', NULL),
('bin-027C', '027C', '15 01 01', 'Pozostałości tektury litej z wycinanych formatów', NULL),
('bin-101', '101', '15 01 05', 'Arkusze papieru zalaminowane', NULL),
('bin-25', '25', '15 01 01', 'Tektura lita (szara, twarda) pod okładkę do fotoksiążki', NULL)
ON CONFLICT (id) DO UPDATE SET
  bin_number = EXCLUDED.bin_number,
  classification_code = EXCLUDED.classification_code,
  description = EXCLUDED.description,
  area_ids = EXCLUDED.area_ids;

-- Dla istniejącej tabeli z kolumną machine_ids – zmień nazwę na area_ids
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bins' AND column_name = 'machine_ids') THEN
    ALTER TABLE bins RENAME COLUMN machine_ids TO area_ids;
  END IF;
END $$;