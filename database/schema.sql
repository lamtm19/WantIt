-- ============================================================
-- WantIt - Schéma PostgreSQL (Supabase)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- pour les calculs de distance

-- ============================================================
-- PROFILS UTILISATEURS
-- (Supabase Auth gère auth.users, on étend avec profiles)
-- ============================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  avatar_url    TEXT,
  city          VARCHAR(100),
  postal_code   VARCHAR(10),
  region        VARCHAR(100),
  latitude      DECIMAL(10, 8),
  longitude     DECIMAL(11, 8),
  is_admin      BOOLEAN      DEFAULT FALSE,
  is_banned     BOOLEAN      DEFAULT FALSE,
  ban_reason    TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- CATÉGORIES
-- ============================================================

CREATE TABLE categories (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  icon        VARCHAR(50),
  is_active   BOOLEAN      DEFAULT TRUE,
  sort_order  INT          DEFAULT 0,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Catégories par défaut
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Vêtements',      'vetements',      'shirt',          1),
  ('Chaussures',     'chaussures',     'footprints',     2),
  ('Accessoires',    'accessoires',    'watch',          3),
  ('Beauté / Soin',  'beaute-soin',    'sparkles',       4),
  ('Maison',         'maison',         'home',           5),
  ('Électronique',   'electronique',   'cpu',            6),
  ('Jeux vidéo',     'jeux-video',     'gamepad-2',      7),
  ('Sport',          'sport',          'dumbbell',       8),
  ('Autre',          'autre',          'package',        9);

-- ============================================================
-- MARQUES
-- ============================================================

CREATE TABLE brands (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  is_approved BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- ANNONCES DE RECHERCHE
-- ============================================================

CREATE TYPE listing_status AS ENUM ('active', 'found', 'cancelled');
CREATE TYPE item_condition AS ENUM (
  'new_with_tags',
  'new_without_tags',
  'very_good',
  'good',
  'fair'
);

CREATE TABLE listings (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id     UUID           REFERENCES categories(id) ON DELETE SET NULL,
  title           VARCHAR(200)   NOT NULL,
  description     TEXT,
  price_min       DECIMAL(10, 2) NOT NULL CHECK (price_min >= 0),
  price_max       DECIMAL(10, 2) NOT NULL CHECK (price_max >= 0),
  max_distance_km INT            NOT NULL DEFAULT 50,
  conditions      item_condition[] NOT NULL DEFAULT '{}',
  is_urgent       BOOLEAN        DEFAULT FALSE,
  status          listing_status DEFAULT 'active',
  -- Localisation copiée du profil au moment de la création
  city            VARCHAR(100),
  postal_code     VARCHAR(10),
  region          VARCHAR(100),
  latitude        DECIMAL(10, 8),
  longitude       DECIMAL(11, 8),
  view_count      INT            DEFAULT 0,
  created_at      TIMESTAMPTZ    DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    DEFAULT NOW()
);

-- Images d'une annonce
CREATE TABLE listing_images (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  sort_order  INT         DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Marques associées à une annonce
CREATE TABLE listing_brands (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  brand_id    UUID        REFERENCES brands(id) ON DELETE SET NULL,
  brand_name  VARCHAR(100) -- si la marque est saisie librement
);

-- Unicité : une marque référencée ne peut apparaître qu'une fois par annonce
CREATE UNIQUE INDEX uq_listing_brand_id
  ON listing_brands (listing_id, brand_id)
  WHERE brand_id IS NOT NULL;

-- Unicité : un nom libre ne peut apparaître qu'une fois par annonce (sans brand_id)
CREATE UNIQUE INDEX uq_listing_brand_name
  ON listing_brands (listing_id, brand_name)
  WHERE brand_id IS NULL AND brand_name IS NOT NULL;

-- ============================================================
-- CONVERSATIONS
-- ============================================================

CREATE TABLE conversations (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id        UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_flagged      BOOLEAN     DEFAULT FALSE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (listing_id, seller_id) -- un vendeur ne peut ouvrir qu'une seule conv par annonce
);

-- ============================================================
-- MESSAGES
-- ============================================================

CREATE TYPE message_type AS ENUM ('text', 'image', 'offer', 'counter_offer', 'system');
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'rejected', 'countered');

CREATE TABLE messages (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID         NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            message_type DEFAULT 'text',
  content         TEXT,
  image_url       TEXT,
  -- Pour les offres
  offer_amount    DECIMAL(10, 2),
  offer_status    offer_status DEFAULT 'pending',
  offer_parent_id UUID         REFERENCES messages(id), -- pour les contre-offres
  is_read         BOOLEAN      DEFAULT FALSE,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE transactions (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID        NOT NULL UNIQUE REFERENCES conversations(id),
  listing_id      UUID        NOT NULL REFERENCES listings(id),
  buyer_id        UUID        NOT NULL REFERENCES profiles(id),
  seller_id       UUID        NOT NULL REFERENCES profiles(id),
  agreed_price    DECIMAL(10, 2),
  validated_at    TIMESTAMPTZ DEFAULT NOW(),
  buyer_reviewed  BOOLEAN     DEFAULT FALSE,
  seller_reviewed BOOLEAN     DEFAULT FALSE
);

-- ============================================================
-- AVIS
-- ============================================================

CREATE TABLE reviews (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID        NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  reviewer_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating         SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (transaction_id, reviewer_id)
);

-- ============================================================
-- SIGNALEMENTS
-- ============================================================

CREATE TYPE report_type   AS ENUM ('listing', 'user', 'message', 'conversation');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed', 'actioned');

CREATE TABLE reports (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID          NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        report_type   NOT NULL,
  target_id   UUID          NOT NULL, -- listing_id, user_id ou message_id
  reason      TEXT          NOT NULL,
  status      report_status DEFAULT 'pending',
  admin_note  TEXT,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- BLOCAGES
-- ============================================================

CREATE TABLE blocked_users (
  blocker_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- ============================================================
-- MOTS INTERDITS
-- ============================================================

CREATE TABLE forbidden_words (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  word       VARCHAR(100) NOT NULL UNIQUE,
  created_by UUID        REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEX
-- ============================================================

CREATE INDEX idx_listings_user       ON listings(user_id);
CREATE INDEX idx_listings_category   ON listings(category_id);
CREATE INDEX idx_listings_status     ON listings(status);
CREATE INDEX idx_listings_location   ON listings(latitude, longitude);
CREATE INDEX idx_listings_created    ON listings(created_at DESC);
CREATE INDEX idx_messages_conv       ON messages(conversation_id, created_at);
CREATE INDEX idx_conversations_buyer  ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON conversations(seller_id);
CREATE INDEX idx_reviews_reviewed    ON reviews(reviewed_id);
CREATE INDEX idx_reports_status      ON reports(status);

-- ============================================================
-- FONCTIONS UTILITAIRES
-- ============================================================

-- Calcul de la note moyenne d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_rating(user_id UUID)
RETURNS NUMERIC AS $$
  SELECT ROUND(AVG(rating)::NUMERIC, 1)
  FROM reviews
  WHERE reviewed_id = user_id;
$$ LANGUAGE sql STABLE;

-- Distance entre deux points (en km) - Haversine simplifiée
CREATE OR REPLACE FUNCTION distance_km(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R CONSTANT DECIMAL := 6371;
  dlat DECIMAL := RADIANS(lat2 - lat1);
  dlon DECIMAL := RADIANS(lon2 - lon1);
  a DECIMAL;
BEGIN
  a := SIN(dlat/2)^2 + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2)^2;
  RETURN R * 2 * ATAN2(SQRT(a), SQRT(1-a));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images    ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_brands    ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users     ENABLE ROW LEVEL SECURITY;

-- Profils : lecture publique, écriture par le propriétaire
CREATE POLICY "profiles_read_all"   ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_write_own"  ON profiles FOR ALL   USING (auth.uid() = id);

-- Listings : lecture publique (sauf bannis), écriture par le propriétaire
CREATE POLICY "listings_read_all"  ON listings FOR SELECT USING (TRUE);
CREATE POLICY "listings_write_own" ON listings FOR ALL   USING (auth.uid() = user_id);

-- Images : lecture publique, écriture par le propriétaire de l'annonce
CREATE POLICY "images_read_all"  ON listing_images FOR SELECT USING (TRUE);
CREATE POLICY "images_write_own" ON listing_images FOR ALL
  USING (EXISTS (SELECT 1 FROM listings l WHERE l.id = listing_id AND l.user_id = auth.uid()));

-- Conversations : accès aux participants uniquement
CREATE POLICY "conv_access" ON conversations FOR ALL
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages : accès aux participants de la conversation
CREATE POLICY "msg_access" ON messages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  ));

-- Transactions : accès aux participants
CREATE POLICY "tx_access" ON transactions FOR ALL
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Avis : lecture publique, écriture par le revieweur
CREATE POLICY "reviews_read_all"  ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_write_own" ON reviews FOR ALL   USING (auth.uid() = reviewer_id);

-- Signalements : écriture par n'importe quel utilisateur, lecture par l'admin
CREATE POLICY "reports_write" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_read_own" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- Blocages : gestion par le bloqueur
CREATE POLICY "blocked_own" ON blocked_users FOR ALL USING (auth.uid() = blocker_id);
