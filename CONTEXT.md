# WantIt — Contexte projet

## Stack
- **Frontend** : Vue 3 + Pinia + Vite + TailwindCSS + Lucide icons + vue-toastification
- **Backend** : Node.js + Express + Socket.io
- **DB** : Supabase (PostgreSQL) — clé `SUPABASE_SERVICE_KEY` (service_role, bypass RLS)
- **Auth** : Supabase Auth (JWT Bearer token)

## Architecture
```
frontend/src/
  views/          # Pages principales
  components/
    common/       # ListingCard, Navbar, UserAvatar
    listings/     # ListingFilters (prix, marque, état, urgent)
  stores/         # Pinia : auth, listings, conversations
  services/
    api.js        # Axios avec intercepteur Bearer token
    socket.js     # Socket.io client + onSocketConnect() pour reconnexion
  router/index.js # Routes, guard requiresAuth

backend/src/
  controllers/    # listingController, authController, conversationController...
  routes/         # auth, users, listings, categories, brands, conversations, messages, reviews, reports
  middleware/
    auth.js       # requireAuth / optionalAuth (vérifie JWT + is_banned)
  config/supabase.js  # createClient avec service_role key
  socket/socketHandler.js
```

## Tables Supabase (actives)
| Table | Notes |
|-------|-------|
| `profiles` | Étend auth.users. Champs: username, avatar_url, city, postal_code, region, lat/lon, is_banned |
| `listings` | status: active/found/cancelled. FK → profiles, categories |
| `listing_images` | CASCADE sur listings |
| `listing_brands` | Seulement `brand_name` (texte libre). `brand_id` supprimé (migration 006) |
| `categories` | Données fixes (9 catégories) |
| `conversations` | buyer_id + seller_id + listing_id |
| `messages` | type: text/image/offer/counter_offer/system. Champ `is_read` (migration 005) |
| `transactions` | ON DELETE CASCADE sur listing_id (migration 007) |
| `reviews` | UNIQUE(transaction_id, reviewer_id) |

## Tables supprimées par l'utilisateur
- `brands` — remplacée par liste statique dans `backend/src/routes/brands.js`
- `blocked_users` — fonctions stubbed 501 dans userController
- `reports` — route stubbed 501 dans routes/reports.js
- `forbidden_words` — admin supprimé

## Migrations appliquées (à vérifier)
- `005` : ADD COLUMN is_read sur messages
- `006` : DROP COLUMN brand_id sur listing_brands
- `007` : transactions.listing_id ON DELETE CASCADE
- `008` : DISABLE RLS sur reviews
- `009` : DISABLE RLS sur toutes les tables (FIX CRITIQUE — résout création annonce + avis)

> ⚠️ Si création d'annonce ou avis échoue avec erreur RLS → exécuter migration 009 dans Supabase SQL Editor

## Fonctionnalités principales
- **Home** : grille d'annonces, filtres catégorie (boutons), sidebar filtres (prix/marque/état/urgent), tri
- **Listings** : créer, modifier, supprimer (cascade DB), changer statut (active/found/cancelled)
- **Conversations** : temps réel Socket.io, offres, contre-offres
- **Messages** : badge non lus sur icône (via `notification:message` socket event)
- **Reviews** : laisser un avis après transaction (buyer ou seller)
- **Profil** : avatar upload (Supabase Storage bucket `wantit-images`), localisation

## Socket.io
- Rooms : `user:${userId}` (notifications), `conv:${convId}` (messages)
- `onSocketConnect(cb)` dans socket.js — re-enregistre les listeners à chaque reconnexion
- App.vue écoute `notification:message` → `convStore.fetchUnreadCount()`

## Points importants / pièges
- **RLS désactivé** : le service_role ne bypassait pas RLS dans ce projet → toutes les tables ont RLS disabled (migration 009)
- **brands** : plus de table DB, liste statique dans routes/brands.js, `brand_name` texte libre dans listing_brands
- **Admin supprimé** : pas de routes admin, pas de middleware admin, pas de vues admin
- **is_admin retiré** : auth.js middleware ne sélectionne plus `is_admin` depuis profiles
- **Suppression annonce "trouvée"** : migration 007 ajoute CASCADE sur transactions.listing_id
- **Compteur delete** : MyListingsView décrémente counts localement après suppression

## Variables d'env backend (.env)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```
