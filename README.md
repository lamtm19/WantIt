# WantIt

> Plateforme de mise en relation inversée — les acheteurs publient leurs besoins, les vendeurs viennent à eux.

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Problématique](#2-problématique)
3. [Solution proposée](#3-solution-proposée)
4. [Technologies utilisées](#4-technologies-utilisées)
5. [Installation en local](#5-installation-en-local)
6. [Configuration des variables d'environnement](#6-configuration-des-variables-denvironnement)
7. [Utilisation](#7-utilisation)
8. [Fonctionnalités principales](#8-fonctionnalités-principales)
9. [Structure du projet](#9-structure-du-projet)
10. [Sécurité mise en place](#10-sécurité-mise-en-place)
11. [Améliorations futures](#11-améliorations-futures)
12. [Membres du groupe](#12-membres-du-groupe)

---

## 1. Présentation du projet

**WantIt** est une application web de mise en relation locale conçue dans le cadre du projet fil rouge EFREI.

L'idée repose sur un modèle inversé par rapport aux plateformes classiques (Vinted, Leboncoin) : ce sont les **acheteurs qui publient ce qu'ils recherchent**, et les **vendeurs qui les contactent**. Les échanges se font exclusivement en main propre, sans paiement intégré.

L'application est entièrement responsive, pensée pour une utilisation mobile et desktop.

---

## 2. Problématique

Les plateformes de vente entre particuliers actuelles imposent aux acheteurs de passer des heures à parcourir des milliers d'annonces, souvent hors de portée géographique ou au-dessus de leur budget. Il n'existe pas de solution simple permettant à un acheteur d'exprimer un besoin précis et d'attendre que les vendeurs viennent à lui.

**Questions auxquelles répond WantIt :**
- Comment réduire le temps de recherche pour un acheteur ?
- Comment permettre aux vendeurs de cibler des acheteurs déjà intéressés ?
- Comment garantir une expérience locale, claire et sans bruit visuel ?

---

## 3. Solution proposée

WantIt propose un modèle de marché inversé :

- L'**acheteur** publie une "recherche" : titre, description, budget min/max, état souhaité, marques acceptées, distance maximale.
- Les **vendeurs** parcourent les recherches et initient le contact via une messagerie temps réel intégrée.
- Un système d'**offres et contre-offres** permet de négocier le prix directement dans la conversation.
- Une fois l'échange effectué en main propre, l'acheteur **valide la transaction** et les deux parties peuvent se laisser des **avis**.

---

## 4. Technologies utilisées

### Frontend
| Technologie | Rôle |
|-------------|------|
| Vue.js 3 (Composition API) | Framework UI |
| Vite | Bundler |
| Pinia | Gestion d'état global |
| Vue Router | Routage |
| Tailwind CSS | Styles utilitaires |
| Socket.io Client | Messagerie temps réel |
| Axios | Requêtes HTTP |
| Lucide Vue | Icônes |

### Backend
| Technologie | Rôle |
|-------------|------|
| Node.js + Express | Serveur HTTP / API REST |
| Socket.io | Serveur de messagerie temps réel |
| express-validator | Validation des entrées |
| Helmet.js | En-têtes HTTP de sécurité |
| express-rate-limit | Limitation du nombre de requêtes |
| Resend | Service d'envoi d'emails transactionnels |

### Base de données & services cloud
| Technologie | Rôle |
|-------------|------|
| Supabase (PostgreSQL) | Base de données relationnelle |
| Supabase Auth | Authentification (JWT) |
| Supabase Storage | Stockage d'images |

---

## 5. Installation en local

### Prérequis

- Node.js >= 18
- Un compte [Supabase](https://supabase.com) (gratuit)
- Un compte [Resend](https://resend.com) (gratuit, optionnel en développement)

### Étape 1 — Configurer la base de données Supabase

1. Créer un nouveau projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor** et exécuter le fichier `database/schema.sql`
3. Dans **Storage**, créer un bucket public nommé `wantit-images`
4. Récupérer les clés dans **Project Settings > API** :
   - `Project URL`
   - `anon (public)` key
   - `service_role` key
   - `JWT Secret`

### Étape 2 — Lancer le backend

```bash
cd backend
cp .env.example .env
# Remplir le fichier .env (voir section 6)
npm install
npm run dev
# API disponible sur http://localhost:3001
```

### Étape 3 — Lancer le frontend

```bash
cd frontend
cp .env.example .env
# Remplir le fichier .env (voir section 6)
npm install
npm run dev
# Application disponible sur http://localhost:5173
```

---

## 6. Configuration des variables d'environnement

### `backend/.env`

```env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...        # Clé service_role (privée)
SUPABASE_JWT_SECRET=your-jwt-secret

# Application
FRONTEND_URL=http://localhost:5173

# Emails (optionnel en développement — les liens s'affichent en console)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=WantIt <noreply@votredomaine.com>

# Confirmation email obligatoire (false en dev, true en prod)
REQUIRE_EMAIL_CONFIRMATION=false
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...      # Clé anon/public
```

> **Note :** Les fichiers `.env` ne doivent jamais être committés. Ils sont listés dans `.gitignore`. Des fichiers `.env.example` sans valeurs sensibles sont fournis.

---

## 7. Utilisation

### Parcours acheteur

1. Créer un compte et confirmer son email
2. Publier une recherche (titre, budget, état, marques, distance)
3. Attendre que des vendeurs prennent contact
4. Discuter, négocier via le chat temps réel
5. Valider la transaction après l'échange en main propre
6. Laisser un avis au vendeur

### Parcours vendeur

1. Créer un compte
2. Parcourir les recherches publiées (avec filtres : marque, prix, état, urgence)
3. Contacter un acheteur dont la recherche correspond à un bien disponible
4. Proposer un prix via le système d'offres
5. Organiser l'échange, recevoir l'avis

---

## 8. Fonctionnalités principales

### Authentification

| Fonctionnalité | Détail |
|----------------|--------|
| Inscription | Email + mot de passe (8 caractères min), pseudo unique, ville |
| Confirmation email | Lien envoyé par email (Resend) avec token sécurisé |
| Connexion | JWT via Supabase Auth |
| Mot de passe oublié | Lien de réinitialisation par email |
| Réinitialisation | Token OTP vérifié côté backend |
| Déconnexion | Suppression du token en mémoire |
| Suppression de compte | Supprime profil, annonces, conversations et compte auth |

### CRUD — Annonces (Listings)

| Opération | Description |
|-----------|-------------|
| **Create** | Titre, description, catégorie, budget min/max, état(s) acceptable(s), marques, distance max, urgence, photos (upload Supabase Storage) |
| **Read** | Liste paginée avec filtres (marque, prix, état, urgence), recherche full-text, détail complet |
| **Update** | Modification de tous les champs, ajout/suppression de photos |
| **Delete** | Suppression de l'annonce et de ses images associées |
| Statuts | Active → Trouvée / Annulée (changement de statut) |

### CRUD — Profil utilisateur

| Opération | Description |
|-----------|-------------|
| **Create** | Pseudo, Email, Mot de passe, Corfirmation de mdp, Localisation et Email de confirmation |
| **Read** | Profil public avec annonces et avis reçus |
| **Update** | Pseudo, ville, code postal, région, coordonnées GPS |
| **Delete** | Suppression dans les Users de Supabase |
| Avatar | Upload et remplacement d'image de profil |
| Mot de passe | Modification depuis les paramètres |

### Messagerie

- Chat instantané via **Socket.io**
- Messages texte et envoi de photos
- **Système d'offres** : proposer un prix, accepter, refuser ou contre-offrir
- Indicateur "en train d'écrire"
- Compteur de messages non lus
- Persistance des messages en base de données

### Transactions & Avis

- Validation de transaction par l'acheteur (passe l'annonce en "Trouvée")
- Avis uniquement après transaction validée (note /5 + commentaire)
- Note globale calculée sur le profil

### Filtres & Recherche

- Filtres : marque (texte libre), prix min/max, état du produit, urgence
- Tri : plus récentes, urgentes d'abord, prix croissant/décroissant
- Recherche full-text sur le titre et la description
- Filtrage par catégorie (boutons rapides)

---

## 9. Structure du projet

```
wantit/
├── backend/
│   ├── src/
│   │   ├── index.js              # Point d'entrée, Express + Socket.io
│   │   ├── config/
│   │   │   └── supabase.js       # Client Supabase (service_role)
│   │   ├── middleware/
│   │   │   ├── auth.js           # Vérification JWT (requireAuth / optionalAuth)
│   │   │   └── validate.js       # Gestion des erreurs express-validator
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── listings.js
│   │   │   ├── conversations.js
│   │   │   ├── users.js
│   │   │   ├── reviews.js
│   │   │   ├── categories.js
│   │   │   └── brands.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── listingController.js
│   │   │   ├── conversationController.js
│   │   │   ├── userController.js
│   │   │   └── reviewController.js
│   │   ├── services/
│   │   │   └── emailService.js   # Templates et envoi via Resend
│   │   └── socket/
│   │       └── socketHandler.js  # Gestion temps réel (messages, offres, typing)
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── HomeView.vue
│   │   │   ├── ListingCreateView.vue
│   │   │   ├── ListingEditView.vue
│   │   │   ├── ListingDetailView.vue
│   │   │   ├── ConversationView.vue
│   │   │   ├── MessagesView.vue
│   │   │   ├── ProfileView.vue
│   │   │   ├── LoginView.vue
│   │   │   ├── RegisterView.vue
│   │   │   ├── ResetPasswordView.vue
│   │   │   └── ConfirmEmailView.vue
│   │   ├── components/
│   │   │   ├── common/           # Navbar, Footer, UserAvatar, ListingCard
│   │   │   ├── listings/         # ListingFilters
│   │   │   └── chat/             # MessageBubble
│   │   ├── stores/
│   │   │   ├── auth.js           # Session utilisateur (Pinia)
│   │   │   ├── listings.js       # Annonces
│   │   │   └── conversations.js  # Messagerie + compteur non lus
│   │   ├── services/
│   │   │   ├── api.js            # Instance Axios
│   │   │   └── socket.js         # Connexion Socket.io + callbacks reconnexion
│   │   ├── router/
│   │   │   └── index.js          # Routes + guards d'authentification
│   │   └── assets/
│   │       └── main.css          # Tailwind + composants personnalisés
│   ├── .env.example
│   └── package.json
│
└── database/
    └── schema.sql
```

---

## 10. Sécurité mise en place

### Authentification & Autorisation
- **JWT** signé par Supabase Auth, vérifié sur chaque requête protégée via le middleware `requireAuth`
- Middleware `optionalAuth` pour les routes publiques (lecture d'annonces sans compte)
- Chaque opération vérifie que l'utilisateur est bien propriétaire de la ressource (annonce, conversation)
- **Socket.io** : chaque connexion est authentifiée par token JWT avant d'être acceptée

### Validation des entrées
- `express-validator` sur toutes les routes POST/PUT/PATCH : types, longueurs, formats (UUID, email, float, etc.)
- Limites explicites sur les champs à risque : messages (5 000 caractères max), commentaires d'avis (1 000 caractères max), montants d'offres (0,01 € → 999 999 €)
- Pagination bornée côté serveur (1–100 résultats max par requête)

### Protection contre les attaques courantes
| Menace | Mesure |
|--------|--------|
| Injection SQL | Requêtes Supabase entièrement paramétrées (pas de SQL brut) |
| XSS | Vue.js échappe automatiquement toutes les expressions dans les templates |
| CSRF | API REST stateless avec JWT (pas de cookies de session) |
| Clickjacking / headers | **Helmet.js** (X-Frame-Options, HSTS, CSP, etc.) |
| Brute force | **express-rate-limit** : 300 req / 15 min en production |
| Accès non autorisé | CORS restreint à l'URL du frontend uniquement |

### Données sensibles
- Les clés API et secrets sont exclusivement dans des fichiers `.env` non committés
- Le mot de passe n'est jamais stocké en clair (géré par Supabase Auth avec bcrypt)
- La clé `service_role` Supabase n'est utilisée que côté backend, jamais exposée au client

---

## 11. Améliorations futures

- **Panel Admin** : Modération des mots-clés illégaux et filtrage automatique, signalement de contenus inappropriés et blocage d'utilisateur entre membres
- **Géolocalisation réelle** : filtrage des annonces par rayon GPS autour de l'utilisateur
- **Notifications push** : alertes navigateur pour les nouveaux messages (Web Push API)
- **Application mobile** : version React Native ou PWA
- **Recherche avancée** : filtres combinés sauvegardés, alertes email pour nouvelles annonces correspondantes
- **Vérification d'identité** : badge "utilisateur vérifié" après validation de pièce d'identité
- **Statistiques vendeur** : tableau de bord avec nombre de contacts, taux de réponse

---

## 12. Membres du groupe

| Nom | Rôle |
|-----|------|
| Lam Tham Vo | Développeur Backend |
| Ilian Arichi | Développeur Backend |
| Hasham Hassan | Développeur Frontend |
| Taha BenChaben | Développeur Frontend |

---

*Projet fil rouge de l'équipe F11
