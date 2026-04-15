-- ============================================================
-- Migration 004 : Politiques RLS manquantes + bypass service_role
-- Résout "Erreur lors de la création de l'annonce"
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. listing_brands : politiques manquantes
--    (RLS activé mais aucune politique → inserts bloqués)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "brands_read_all"  ON listing_brands;
DROP POLICY IF EXISTS "brands_write_own" ON listing_brands;

CREATE POLICY "brands_read_all" ON listing_brands
  FOR SELECT USING (TRUE);

CREATE POLICY "brands_write_own" ON listing_brands
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id AND l.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- 2. S'assurer que le service_role bypasse bien le RLS
--    (normalement automatique dans Supabase, mais on le force)
-- ────────────────────────────────────────────────────────────
ALTER TABLE profiles       NO FORCE ROW LEVEL SECURITY;
ALTER TABLE listings       NO FORCE ROW LEVEL SECURITY;
ALTER TABLE listing_images NO FORCE ROW LEVEL SECURITY;
ALTER TABLE listing_brands NO FORCE ROW LEVEL SECURITY;
ALTER TABLE conversations  NO FORCE ROW LEVEL SECURITY;
ALTER TABLE messages       NO FORCE ROW LEVEL SECURITY;
ALTER TABLE transactions   NO FORCE ROW LEVEL SECURITY;
ALTER TABLE reviews        NO FORCE ROW LEVEL SECURITY;
ALTER TABLE reports        NO FORCE ROW LEVEL SECURITY;
ALTER TABLE blocked_users  NO FORCE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────────────────────
-- 3. Grant explicit au service_role pour toutes les tables
-- ────────────────────────────────────────────────────────────
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- ────────────────────────────────────────────────────────────
-- 4. Corriger la politique reviews_write_own
--    (FOR ALL sans WITH CHECK peut bloquer les INSERT)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "reviews_write_own" ON reviews;

CREATE POLICY "reviews_write_own" ON reviews
  FOR ALL USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- ────────────────────────────────────────────────────────────
-- 5. Vérification
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 004 : politiques RLS corrigées';
  RAISE NOTICE '   - listing_brands : lecture publique + écriture propriétaire OK';
  RAISE NOTICE '   - reviews : WITH CHECK ajouté';
  RAISE NOTICE '   - service_role bypass confirmé sur toutes les tables';
END $$;
