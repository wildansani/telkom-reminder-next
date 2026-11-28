-- Jalankan sekali di Neon SQL Editor (Console)
-- 1) Hapus duplikat (jika ada) sebelum membuat unique index
DELETE FROM indibiz_billing a
USING indibiz_billing b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.nomor_layanan = b.nomor_layanan;

-- 2) Unique index wajib untuk ON CONFLICT (user_id, nomor_layanan)
CREATE UNIQUE INDEX IF NOT EXISTS idx_indibiz_user_snd
  ON indibiz_billing (user_id, nomor_layanan);

-- 3) Index bantu untuk query dashboard
CREATE INDEX IF NOT EXISTS idx_indibiz_user_datel
  ON indibiz_billing (user_id, datel_sto);
CREATE INDEX IF NOT EXISTS idx_indibiz_user_caring
  ON indibiz_billing (user_id, status_caring);
