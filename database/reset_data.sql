-- ============================================================
-- WantIt - RESET DONNÉES UTILISATEURS
-- Supprime TOUS les comptes, annonces, conversations, etc.
-- Conserve : categories, brands, forbidden_words
--
-- ⚠️  IRRÉVERSIBLE — exécuter dans Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Données applicatives (ordre FK : feuilles → racines)
-- ────────────────────────────────────────────────────────────

DELETE FROM reviews;
DELETE FROM transactions;
DELETE FROM reports;
DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM blocked_users;
DELETE FROM listing_brands;
DELETE FROM listing_images;
DELETE FROM listings;
DELETE FROM profiles;

-- ────────────────────────────────────────────────────────────
-- 2. Tables auth Supabase (ordre obligatoire, pas de CASCADE auto)
--    ⚠️  Ne PAS utiliser session_replication_role = replica
--    car ça désactive les cascades et laisse les emails bloqués
-- ────────────────────────────────────────────────────────────

DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;
DELETE FROM auth.identities;
DELETE FROM auth.audit_log_entries;
DELETE FROM auth.users;

-- ────────────────────────────────────────────────────────────
-- 3. Vérification
-- ────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_users       INT;
  v_profiles    INT;
  v_listings    INT;
  v_convs       INT;
  v_messages    INT;
  v_cats        INT;
BEGIN
  SELECT COUNT(*) INTO v_users    FROM auth.users;
  SELECT COUNT(*) INTO v_profiles FROM profiles;
  SELECT COUNT(*) INTO v_listings FROM listings;
  SELECT COUNT(*) INTO v_convs    FROM conversations;
  SELECT COUNT(*) INTO v_messages FROM messages;
  SELECT COUNT(*) INTO v_cats     FROM categories;

  RAISE NOTICE '────────────────────────────────────';
  RAISE NOTICE '✅ Reset terminé';
  RAISE NOTICE '   auth.users     : %', v_users;
  RAISE NOTICE '   profiles       : %', v_profiles;
  RAISE NOTICE '   listings       : %', v_listings;
  RAISE NOTICE '   conversations  : %', v_convs;
  RAISE NOTICE '   messages       : %', v_messages;
  RAISE NOTICE '   categories     : % (conservées ✓)', v_cats;
  RAISE NOTICE '────────────────────────────────────';

  IF v_users > 0 OR v_profiles > 0 OR v_listings > 0 THEN
    RAISE WARNING '⚠️  Des données n''ont pas été supprimées — vérifiez les contraintes FK';
  END IF;
END $$;
