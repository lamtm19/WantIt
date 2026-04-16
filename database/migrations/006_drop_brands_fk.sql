-- ============================================================
-- Migration 006 : Suppression de la dépendance à la table brands
--
-- La table brands a été supprimée. On doit :
-- 1. Supprimer la contrainte FK brand_id -> brands(id)
-- 2. Supprimer la colonne brand_id (plus utilisée, on utilise brand_name)
-- 3. Supprimer l'index partiel sur brand_id
-- ============================================================

-- Supprimer l'index partiel uq_listing_brand_id (dépend de brand_id)
DROP INDEX IF EXISTS uq_listing_brand_id;

-- Supprimer la colonne brand_id (la FK est supprimée automatiquement)
ALTER TABLE listing_brands DROP COLUMN IF EXISTS brand_id;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 006 : FK brand_id supprimée de listing_brands';
  RAISE NOTICE '   - Index uq_listing_brand_id supprimé';
  RAISE NOTICE '   - Colonne brand_id supprimée';
END $$;
