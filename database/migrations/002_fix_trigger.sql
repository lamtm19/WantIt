-- ============================================================
-- Migration 002 : Correction du trigger handle_new_user
-- Le trigger ne doit JAMAIS faire échouer la création de compte
-- ============================================================

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
      NULLIF(NEW.raw_user_meta_data->>'username', ''),
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    NULLIF(NEW.raw_user_meta_data->>'city', ''),
    NULLIF(NEW.raw_user_meta_data->>'postal_code', ''),
    NULLIF(NEW.raw_user_meta_data->>'region', ''),
    CASE WHEN NEW.raw_user_meta_data->>'latitude'  ~ '^-?[0-9]+\.?[0-9]*$'
         THEN (NEW.raw_user_meta_data->>'latitude')::DECIMAL  ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data->>'longitude' ~ '^-?[0-9]+\.?[0-9]*$'
         THEN (NEW.raw_user_meta_data->>'longitude')::DECIMAL ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Ne jamais bloquer la création de compte à cause du profil
  RAISE WARNING '[handle_new_user] Erreur ignorée : %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

DO $$ BEGIN
  RAISE NOTICE '✅ Migration 002 : trigger handle_new_user corrigé';
END $$;
