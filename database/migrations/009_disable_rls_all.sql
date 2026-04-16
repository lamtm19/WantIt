-- ============================================================
-- Migration 009 : Désactiver RLS sur toutes les tables backend
--
-- Le backend utilise service_role qui devrait bypasser RLS,
-- mais selon la config Supabase cela ne fonctionne pas toujours.
-- La sécurité est gérée au niveau API (Express middleware + auth).
-- ============================================================

ALTER TABLE profiles        DISABLE ROW LEVEL SECURITY;
ALTER TABLE listings        DISABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images  DISABLE ROW LEVEL SECURITY;
ALTER TABLE listing_brands  DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations   DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages        DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions    DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews         DISABLE ROW LEVEL SECURITY;

-- S'assurer que le service_role a bien tous les droits
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 009 : RLS désactivé sur toutes les tables';
  RAISE NOTICE '   La sécurité est gérée au niveau API (Express + JWT)';
END $$;
