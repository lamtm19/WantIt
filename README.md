# WantIt 🎯

> Plateforme de mise en relation inversée : les **acheteurs publient leurs besoins**, les **vendeurs les contactent**.

---

## 🧠 Concept

WantIt est l'inverse de Vinted :
- Les acheteurs publient des **recherches de biens**
- Les vendeurs parcourent et contactent les acheteurs
- Pas de livraison, pas de paiement intégré — uniquement de la **mise en relation** et des remises en main propre

---

## 🛠️ Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | Vue.js 3 (Composition API) + Tailwind CSS |
| Backend | Node.js + Express |
| Base de données | PostgreSQL via **Supabase** |
| Authentification | **Supabase Auth** |
| Temps réel | **Socket.io** |
| Stockage images | **Supabase Storage** |
| Emails | **Resend** (gratuit jusqu'à 3000 emails/mois) |
| Déploiement | **Vercel** (frontend) + **Supabase** (BDD + Auth) |

---

## 📁 Structure du projet

```
wantit/
├── backend/               # API Node.js + Express
│   ├── src/
│   │   ├── index.js       # Point d'entrée + Socket.io
│   │   ├── config/        # Client Supabase
│   │   ├── middleware/    # Auth, Admin, Validation
│   │   ├── routes/        # Routes Express
│   │   ├── controllers/   # Logique métier
│   │   ├── services/      # Email (Resend)
│   │   └── socket/        # Handlers Socket.io
│   └── package.json
│
├── frontend/              # Application Vue.js 3
│   ├── src/
│   │   ├── views/         # Pages
│   │   ├── components/    # Composants réutilisables
│   │   ├── stores/        # Pinia (état global)
│   │   ├── router/        # Vue Router
│   │   ├── services/      # API Axios + Socket.io client
│   │   └── assets/        # CSS Tailwind
│   └── package.json
│
└── database/
    └── schema.sql         # Schéma PostgreSQL complet
```

---

## 🚀 Installation & Lancement

### Prérequis
- Node.js >= 18
- Compte [Supabase](https://supabase.com) (gratuit)
- Compte [Resend](https://resend.com) pour les emails (optionnel)

### 1. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor** et exécuter le contenu de `database/schema.sql`
3. Dans **Storage**, créer un bucket public nommé `wantit-images`
4. Récupérer vos clés dans **Project Settings > API** :
   - `Project URL`
   - `anon (public)` key
   - `service_role` key
   - `JWT Secret`

### 2. Configurer le Backend

```bash
cd backend
cp .env.example .env
npm install
```

Remplir `.env` :
```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...   # service_role key
SUPABASE_JWT_SECRET=your-jwt-secret

FRONTEND_URL=http://localhost:5173

RESEND_API_KEY=re_xxxx        # optionnel en dev
EMAIL_FROM=noreply@wantit.app
```

```bash
npm run dev     # Démarre le backend sur http://localhost:3001
```

### 3. Configurer le Frontend

```bash
cd frontend
cp .env.example .env
npm install
```

Remplir `.env` :
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   # anon key
```

```bash
npm run dev     # Démarre le frontend sur http://localhost:5173
```

---

## 🔑 Créer un compte Admin

1. Inscrivez-vous normalement sur le site
2. Dans Supabase > **Table Editor** > `profiles`
3. Trouvez votre ligne et passez `is_admin` à `true`

---

## 📦 Déploiement en production

### Frontend → Vercel

```bash
cd frontend
npm run build
# Déployer le dossier dist/ sur Vercel
# Ou connecter le repo Git à Vercel (auto-deploy)
```

Variables d'environnement Vercel :
```
VITE_API_URL=https://your-backend.vercel.app
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Backend → Vercel / Railway / Render

**Option Vercel** : Ajouter `vercel.json` à la racine du backend :
```json
{
  "version": 2,
  "builds": [{ "src": "src/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/index.js" }]
}
```

⚠️ **Note Socket.io** : Vercel est serverless — pour Socket.io en production, utiliser **Railway** ou **Render** qui supportent les connexions persistantes.

Variables d'environnement backend :
```
NODE_ENV=production
PORT=3001
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SUPABASE_JWT_SECRET=...
FRONTEND_URL=https://your-frontend.vercel.app
RESEND_API_KEY=...
EMAIL_FROM=noreply@wantit.app
```

---

## ✨ Fonctionnalités

### Utilisateurs
- ✅ Inscription / Connexion / Déconnexion
- ✅ Mot de passe oublié
- ✅ Modification du profil & mot de passe
- ✅ Upload d'avatar
- ✅ Suppression de compte
- ✅ Blocage d'utilisateurs
- ✅ Profils publics

### Annonces
- ✅ Création avec titre, description, budget, état, marques, distance
- ✅ Upload de photos (Supabase Storage)
- ✅ Filtres : catégorie, prix, état, distance, urgent
- ✅ Recherche full-text
- ✅ Statuts : Active / Trouvée / Annulée
- ✅ Vérification des mots interdits
- ✅ Tri par proximité / récence / prix

### Messagerie temps réel
- ✅ Chat Socket.io en temps réel
- ✅ Messages texte et photos
- ✅ Système d'offres et contre-offres
- ✅ Indicateur "en train d'écrire"
- ✅ Messages lus / non lus
- ✅ Signalement de conversations
- ✅ Validation de transaction

### Avis
- ✅ Avis après transaction validée uniquement
- ✅ Note sur 5 étoiles + commentaire
- ✅ Modification d'avis
- ✅ Note globale calculée

### Admin
- ✅ Dashboard avec statistiques
- ✅ Gestion des utilisateurs (ban / unban / suppression)
- ✅ Gestion des annonces
- ✅ Traitement des signalements
- ✅ Accès aux conversations signalées
- ✅ Gestion des catégories
- ✅ Validation des marques suggérées
- ✅ Mots interdits

### Emails (Resend)
- ✅ Nouveau message
- ✅ Nouvelle offre
- ✅ Nouvel avis
- ✅ Transaction validée
- ✅ Réinitialisation du mot de passe

---

## 🗄️ Schéma de base de données

```
profiles          → Extension de auth.users (Supabase)
categories        → Catégories de biens
brands            → Marques (avec validation admin)
listings          → Annonces de recherche
listing_images    → Photos des annonces
listing_brands    → Marques liées à une annonce
conversations     → Fils de discussion acheteur↔vendeur
messages          → Messages (texte, image, offre, système)
transactions      → Transactions validées
reviews           → Avis post-transaction
reports           → Signalements
blocked_users     → Blocages entre utilisateurs
forbidden_words   → Mots bloqués par l'admin
```

---

## 🔒 Sécurité

- Row Level Security (RLS) sur toutes les tables Supabase
- Rate limiting (200 req/15min)
- Validation des inputs avec `express-validator`
- Helmet.js (headers HTTP sécurisés)
- CORS restreint au domaine frontend
- Vérification JWT sur toutes les routes protégées
- Détection des mots interdits à la publication

---

## ⚠️ Mention légale

> Cette plateforme met **uniquement en relation** des utilisateurs. Les transactions se font **en main propre**. Nous ne sommes **pas responsables** des paiements ou échanges effectués entre les utilisateurs.

---

## 📧 Contact

Pour toute question ou signalement : support@wantit.app
