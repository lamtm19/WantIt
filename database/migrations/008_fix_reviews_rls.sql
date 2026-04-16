-- ============================================================
-- Migration 008 : Désactiver RLS sur reviews
--
-- Le backend utilise service_role qui devrait bypasser RLS,
-- mais certaines configs Supabase bloquent quand même les INSERT.
-- La sécurité est gérée au niveau API (vérification transaction).
-- ============================================================

-- Désactiver complètement RLS sur reviews
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- S'assurer que le service_role a tous les droits
GRANT ALL ON reviews TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 008 : RLS désactivé sur reviews';
  RAISE NOTICE '   La sécurité est gérée au niveau API (Express middleware)';
END $$;
