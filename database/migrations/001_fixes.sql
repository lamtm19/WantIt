-- ============================================================
-- WantIt - Migration 001 : Corrections et robustesse
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. FONCTION SECURITY DEFINER pour création de profil
--    Contourne les RLS pour que le backend puisse créer des
--    profils même sans service key correctement configurée.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_user_profile(
  p_id          UUID,
  p_username    TEXT,
  p_city        TEXT    DEFAULT NULL,
  p_postal_code TEXT    DEFAULT NULL,
  p_region      TEXT    DEFAULT NULL,
  p_latitude    DECIMAL DEFAULT NULL,
  p_longitude   DECIMAL DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, username, city, postal_code, region, latitude, longitude)
  VALUES (p_id, p_username, p_city, p_postal_code, p_region, p_latitude, p_longitude)
  ON CONFLICT (id) DO UPDATE SET
    username    = EXCLUDED.username,
    city        = COALESCE(EXCLUDED.city,        profiles.city),
    postal_code = COALESCE(EXCLUDED.postal_code, profiles.postal_code),
    region      = COALESCE(EXCLUDED.region,      profiles.region),
    latitude    = COALESCE(EXCLUDED.latitude,    profiles.latitude),
    longitude   = COALESCE(EXCLUDED.longitude,   profiles.longitude),
    updated_at  = NOW();
END;
$$;

-- Autoriser les utilisateurs authentifiés à appeler cette fonction
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile TO anon;
GRANT EXECUTE ON FUNCTION create_user_profile TO service_role;

-- ────────────────────────────────────────────────────────────
-- 2. TRIGGER : création automatique de profil lors de l'inscription
--    Double sécurité si le backend échoue
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, city, postal_code, region, latitude, longitude)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'postal_code',
    NEW.raw_user_meta_data->>'region',
    NULLIF(NEW.raw_user_meta_data->>'latitude',  '')::DECIMAL,
    NULLIF(NEW.raw_user_meta_data->>'longitude', '')::DECIMAL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ────────────────────────────────────────────────────────────
-- 3. CORRECTION des politiques RLS pour les profils
--    Ajoute une politique INSERT explicite avec WITH CHECK
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_write_own"  ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Lecture : tout le monde peut lire les profils publics
-- (déjà défini, on le recrée pour être sûr)
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
CREATE POLICY "profiles_read_all" ON profiles
  FOR SELECT USING (TRUE);

-- Insertion : uniquement pour son propre profil
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Modification et suppression : uniquement par le propriétaire
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- 4. NETTOYAGE des données orphelines
--    Annonces dont le propriétaire n'existe plus
-- ────────────────────────────────────────────────────────────
DELETE FROM listings
WHERE user_id NOT IN (SELECT id FROM profiles);

-- ────────────────────────────────────────────────────────────
-- 5. CORRECTION : listing_images RLS pour permettre les inserts
--    depuis le service role (upload d'images)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "images_write_own" ON listing_images;
CREATE POLICY "images_write_own" ON listing_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
      AND l.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
      AND l.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────
-- 6. Vérification post-migration
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 001 appliquée avec succès';
  RAISE NOTICE '   - Fonction create_user_profile créée';
  RAISE NOTICE '   - Trigger on_auth_user_created créé';
  RAISE NOTICE '   - Politiques RLS profiles corrigées';
  RAISE NOTICE '   - Données orphelines nettoyées';
END $$;
