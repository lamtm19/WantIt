-- ============================================================
-- Migration 005 : Ajout colonne is_read sur messages
--                 Nécessaire pour la pastille de messages non lus
-- ============================================================

-- Ajouter la colonne is_read si elle n'existe pas déjà
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- S'assurer que les messages existants ont une valeur par défaut
UPDATE messages SET is_read = FALSE WHERE is_read IS NULL;

-- Politique RLS pour que le service_role puisse lire/mettre à jour is_read
-- (normalement déjà couvert par NO FORCE ROW LEVEL SECURITY de la migration 004)

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 005 : colonne is_read ajoutée/vérifiée sur messages';
END $$;
