-- Programación de notas: visible solo cuando scheduled_at <= NOW() o es NULL
ALTER TABLE notes ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_notes_scheduled_at ON notes(scheduled_at);
