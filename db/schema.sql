BEGIN;

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  editor TEXT NOT NULL DEFAULT 'Jhon Aparicio',
  source_scope TEXT NOT NULL DEFAULT 'nacional',
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  image1 TEXT,
  image2 TEXT,
  image3 TEXT,
  image4 TEXT,
  image5 TEXT,
  image6 TEXT,
  video1 TEXT,
  video2 TEXT,
  video3 TEXT,
  video4 TEXT,
  video5 TEXT,
  video6 TEXT,
  video7 TEXT,
  spec_segmento TEXT,
  spec_origen TEXT,
  spec_precio_estimado TEXT,
  spec_versiones TEXT,
  spec_motorizacion TEXT,
  spec_potencia_hp TEXT,
  spec_torque_nm TEXT,
  spec_bateria_autonomia TEXT,
  spec_bateria_kwh TEXT,
  spec_autonomia_km TEXT,
  spec_carga TEXT,
  spec_carga_ac_kw TEXT,
  spec_carga_dc_kw TEXT,
  spec_aceleracion_0_100 TEXT,
  spec_seguridad TEXT,
  spec_equipamiento TEXT,
  spec_pros TEXT,
  spec_contras TEXT,
  spec_competidores TEXT,
  spec_traccion TEXT,
  spec_precio_cop TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notes ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS editor TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS source_scope TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS image1 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS image2 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS image3 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS image4 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS image5 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS image6 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS video1 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS video2 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS video3 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS video4 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS video5 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS video6 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS video7 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_segmento TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_origen TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_precio_estimado TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_versiones TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_motorizacion TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_potencia_hp TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_torque_nm TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_bateria_autonomia TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_bateria_kwh TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_autonomia_km TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_carga TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_carga_ac_kw TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_carga_dc_kw TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_aceleracion_0_100 TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_seguridad TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_equipamiento TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_pros TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_contras TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_competidores TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_traccion TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS spec_precio_cop TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE notes ADD COLUMN IF NOT EXISTS block_titles TEXT;

UPDATE notes
SET category = 'general'
WHERE category IS NULL OR btrim(category) = '';

UPDATE notes
SET source_scope = 'nacional'
WHERE source_scope IS NULL OR btrim(source_scope) = '';

UPDATE notes
SET source_scope = 'nacional'
WHERE lower(source_scope) NOT IN ('nacional', 'internacional');

UPDATE notes
SET editor = 'Jhon Aparicio'
WHERE editor IS NULL OR btrim(editor) = '';

ALTER TABLE notes ALTER COLUMN category SET DEFAULT 'general';
ALTER TABLE notes ALTER COLUMN category SET NOT NULL;
ALTER TABLE notes ALTER COLUMN editor SET DEFAULT 'Jhon Aparicio';
ALTER TABLE notes ALTER COLUMN editor SET NOT NULL;
ALTER TABLE notes ALTER COLUMN source_scope SET DEFAULT 'nacional';
ALTER TABLE notes ALTER COLUMN source_scope SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
CREATE INDEX IF NOT EXISTS idx_notes_source_scope ON notes(source_scope);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  note_id INT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_ip TEXT,
  tipo TEXT CHECK (tipo IN ('corazon', 'me_gusta')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_likes_note_id ON likes(note_id);

CREATE TABLE IF NOT EXISTS comentarios (
  id SERIAL PRIMARY KEY,
  note_id INT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  nombre TEXT,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comentarios_note_id ON comentarios(note_id);

CREATE TABLE IF NOT EXISTS automatch (
  id SERIAL PRIMARY KEY,
  user_ip TEXT,
  auto_id INT NOT NULL,
  decision TEXT CHECK (decision IN ('like', 'superlike', 'dislike')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automatch_auto_id ON automatch(auto_id);
CREATE INDEX IF NOT EXISTS idx_automatch_decision ON automatch(decision);

CREATE TABLE IF NOT EXISTS automatch_likes (
  id SERIAL PRIMARY KEY,
  auto_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('like', 'corazon')),
  client_id TEXT NOT NULL,
  user_ip TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (auto_id, tipo, client_id)
);

CREATE INDEX IF NOT EXISTS idx_automatch_likes_auto_id ON automatch_likes(auto_id);
CREATE INDEX IF NOT EXISTS idx_automatch_likes_tipo ON automatch_likes(tipo);

CREATE TABLE IF NOT EXISTS automatch_comments (
  id SERIAL PRIMARY KEY,
  auto_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automatch_comments_auto_id ON automatch_comments(auto_id);
CREATE INDEX IF NOT EXISTS idx_automatch_comments_created_at ON automatch_comments(created_at DESC);

CREATE TABLE IF NOT EXISTS test_drives (
  id SERIAL PRIMARY KEY,
  auto_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  mensaje TEXT,
  concesionario_id INT,
  concesionario_nombre VARCHAR(150),
  auto_nombre VARCHAR(150),
  ciudad VARCHAR(100),
  tipo VARCHAR(50),
  presupuesto BIGINT,
  estado VARCHAR(20) DEFAULT 'pendiente',
  user_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_drives_auto_id ON test_drives(auto_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_estado ON test_drives(estado);
CREATE INDEX IF NOT EXISTS idx_test_drives_concesionario ON test_drives(concesionario_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_created_at ON test_drives(created_at DESC);

COMMIT;
