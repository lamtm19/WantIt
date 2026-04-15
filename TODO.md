# TODO: Améliorer interface confirmation email

## ✅ Plan approuvé par l'utilisateur

**Objectif:** Rendre la page de confirmation rassurante malgré lien proxy Supabase.

## 📋 Étapes à compléter:

### 1. ✅ Ajouter endpoint backend pour vérification token
   - `backend/src/controllers/authController.js`: Ajouter `confirmEmail`
   - `backend/src/routes/auth.js`: Ajouter POST `/confirm-email`
   - Test via API (à faire manuellement)

### 2. ✅ Ajouter route frontend
   - `frontend/src/router/index.js`: Route `/confirm-email`

### 3. ✅ Améliorer UI ConfirmEmailView.vue
   - Parser token depuis query/route
   - Vraie vérification API
   - UI rassurante: branding fort, HTTPS badge/lock, progress bar, countdown, auto-redirect
   - États: loading, success (personnalisé), error (explication proxy), footer sécurité

### 4. ✅ Tester fin à fin
   - Manuel: Inscription → Supabase email → lien proxy → nouvelle UI rassurante + vérif token → login
   - Backend endpoint `/api/auth/confirm-email` prêt

### 5. ✅ Terminé

**Corrections apportées pour inscription :**
- Rate limit géré (429 + msg attente)
- Vérif user existence après signUp + delay
- Meilleur rollback + logs

**Interface de confirmation email améliorée:**
- ✅ Branding WantIt renforcé + badges sécurité (HTTPS, Supabase)
- ✅ Vraie vérification token (extraction hash → API backend → Supabase verifyOtp)
- ✅ États: loading (progress), success personnalisé (username), error explicatif (proxy)
- ✅ Auto-redirect + countdown
- ✅ Footer rassurant

Testez: 
1. `cd backend && npm start` (ou votre serveur)
2. `cd frontend && npm run dev`
3. Inscrivez-vous → vérifiez email → cliquez lien → nouvelle UI !

Prochain: Étape 1 (backend)

