-- ============================================================
-- Migration 003 : Nettoyage complet des tables auth Supabase
-- Résout "Database error checking email" après un reset incomplet
-- ============================================================

-- Supprimer dans l'ordre (les FK de auth.* ne cascadent pas via session_replication_role)
DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;
DELETE FROM auth.identities;   -- ← c'est ici que les emails sont bloqués
DELETE FROM auth.audit_log_entries;
DELETE FROM auth.users;

-- Vérification
DO $$
DECLARE
  v_users      INT;
  v_identities INT;
  v_sessions   INT;
BEGIN
  SELECT COUNT(*) INTO v_users      FROM auth.users;
  SELECT COUNT(*) INTO v_identities FROM auth.identities;
  SELECT COUNT(*) INTO v_sessions   FROM auth.sessions;

  RAISE NOTICE '✅ Nettoyage auth terminé';
  RAISE NOTICE '   auth.users      : %', v_users;
  RAISE NOTICE '   auth.identities : %', v_identities;
  RAISE NOTICE '   auth.sessions   : %', v_sessions;

  IF v_users > 0 OR v_identities > 0 THEN
    RAISE WARNING '⚠️  Des entrées auth n''ont pas été supprimées';
  END IF;
END $$;
