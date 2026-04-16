-- ============================================================
-- Migration 007 : Ajout ON DELETE CASCADE sur transactions.listing_id
--
-- Sans ça, supprimer une annonce "trouvée" (qui a une transaction)
-- échoue avec une erreur de contrainte FK.
-- ============================================================

-- Supprimer l'ancienne contrainte
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_listing_id_fkey;

-- Recréer avec ON DELETE CASCADE
ALTER TABLE transactions
  ADD CONSTRAINT transactions_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 007 : transactions.listing_id → ON DELETE CASCADE';
END $$;
