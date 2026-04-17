// Service d'email via Resend (https://resend.com)
// Nécessite RESEND_API_KEY dans .env

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM     = process.env.EMAIL_FROM || 'WantIt <onboarding@resend.dev>'
const BASE           = process.env.FRONTEND_URL || 'http://localhost:5173'

async function send(to, subject, html) {
  if (!RESEND_API_KEY) {
    console.warn(`[EMAIL SKIP] RESEND_API_KEY manquante. À: ${to} | Sujet: ${subject}`)
    return { ok: false }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({
        from:    EMAIL_FROM,
        to:      [to],
        subject,
        html
      })
    })

    const data = await res.json()

    if (!res.ok) {
      console.error(`[EMAIL ERROR] Resend: ${JSON.stringify(data)}`)
      return { ok: false, error: data }
    }

    console.log(`[EMAIL SENT] À: ${to} | Sujet: ${subject} | ID: ${data.id}`)
    return { ok: true, id: data.id }
  } catch (err) {
    console.error(`[EMAIL ERROR] fetch failed: ${err.message}`)
    return { ok: false, error: err.message }
  }
}

function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f1f1f1;
      margin: 0;
      padding: 32px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper { max-width: 560px; margin: 0 auto; }
    .card {
      background: rgba(255, 255, 255, 0.97);
      border-radius: 28px;
      padding: 40px 40px 32px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.06);
    }
    .logo {
      font-size: 22px;
      font-weight: 800;
      color: #0f0f0f;
      letter-spacing: -0.04em;
      margin-bottom: 32px;
      display: inline-block;
      background: linear-gradient(135deg, #000000 0%, #3c3b3b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    h2 {
      color: #0f0f0f;
      margin: 0 0 14px;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1.2;
    }
    p {
      color: #6b7280;
      line-height: 1.65;
      margin: 0 0 12px;
      font-size: 14px;
    }
    strong { color: #1a1a1a; font-weight: 600; }
    .btn {
      display: inline-block;
      background-color: #111111;
      background-image: linear-gradient(135deg, #000000 0%, #3c3b3b 100%);
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      padding: 13px 28px;
      border-radius: 9999px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: -0.01em;
      margin: 20px 0 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    }
    .divider {
      border: none;
      border-top: 1px solid rgba(26, 26, 26, 0.07);
      margin: 28px 0 20px;
    }
    .footer {
      font-size: 12px;
      color: #a3a3a3;
      line-height: 1.6;
    }
    .stars { color: #1a1a1a; font-size: 16px; letter-spacing: 2px; }
    .chip {
      display: inline-block;
      background: #f5f5f5;
      border-radius: 9999px;
      padding: 4px 14px;
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">WantIt</div>
      ${content}
      <hr class="divider">
      <div class="footer">
        Cette plateforme met uniquement en relation des particuliers.<br>
        Les échanges se font exclusivement en main propre, sans paiement intégré.<br><br>
        © ${new Date().getFullYear()} WantIt — Tous droits réservés
      </div>
    </div>
  </div>
</body>
</html>`
}

exports.sendConfirmationEmail = async (to, username, confirmationLink) => {
  return send(
    to,
    'Confirmez votre compte WantIt',
    baseTemplate(`
      <div class="chip">Bienvenue 👋</div>
      <h2>Confirmez votre adresse email</h2>
      <p>Bonjour <strong>${username}</strong>, votre compte WantIt est presque prêt.</p>
      <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse et commencer à publier vos recherches.</p>
      <a class="btn" href="${confirmationLink}">Confirmer mon compte</a>
      <p style="font-size:12px;color:#a3a3a3;margin-top:14px;">
        Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.
      </p>
    `)
  )
}

exports.sendNewMessageEmail = async (to, recipientName, senderName, listingTitle, conversationId) => {
  return send(
    to,
    `Nouveau message de ${senderName}`,
    baseTemplate(`
      <div class="chip">Message reçu</div>
      <h2>Vous avez un nouveau message</h2>
      <p>Bonjour <strong>${recipientName}</strong>,</p>
      <p><strong>${senderName}</strong> vous a contacté au sujet de votre annonce <strong>"${listingTitle}"</strong>.</p>
      <a class="btn" href="${BASE}/messages/${conversationId}">Voir la conversation</a>
    `)
  )
}

exports.sendNewOfferEmail = async (to, recipientName, senderName, listingTitle, amount, conversationId) => {
  return send(
    to,
    `Nouvelle offre de ${senderName}`,
    baseTemplate(`
      <div class="chip">Offre reçue</div>
      <h2>${senderName} vous propose ${amount} €</h2>
      <p>Bonjour <strong>${recipientName}</strong>,</p>
      <p><strong>${senderName}</strong> a fait une offre de <strong>${amount} €</strong> sur votre annonce <strong>"${listingTitle}"</strong>.</p>
      <p>Vous pouvez accepter, refuser ou faire une contre-offre directement dans le chat.</p>
      <a class="btn" href="${BASE}/messages/${conversationId}">Répondre à l'offre</a>
    `)
  )
}

exports.sendNewReviewEmail = async (to, recipientName, reviewerName, rating, listingTitle) => {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  return send(
    to,
    `Nouvel avis de ${reviewerName}`,
    baseTemplate(`
      <div class="chip">Avis reçu</div>
      <h2>Vous avez reçu un avis</h2>
      <p>Bonjour <strong>${recipientName}</strong>,</p>
      <p><strong>${reviewerName}</strong> a laissé un avis suite à la transaction <strong>"${listingTitle}"</strong>.</p>
      <p><span class="stars">${stars}</span></p>
      <a class="btn" href="${BASE}/profile">Voir mon profil</a>
    `)
  )
}

exports.sendResetPasswordEmail = async (to, resetLink) => {
  return send(
    to,
    'Réinitialisation de votre mot de passe WantIt',
    baseTemplate(`
      <div class="chip">Sécurité</div>
      <h2>Réinitialisez votre mot de passe</h2>
      <p>Vous avez demandé à réinitialiser le mot de passe de votre compte WantIt.</p>
      <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
      <a class="btn" href="${resetLink}">Réinitialiser mon mot de passe</a>
      <p style="font-size:12px;color:#a3a3a3;margin-top:14px;">
        Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
      </p>
    `)
  )
}

exports.sendTransactionValidatedEmail = async (to, recipientName, buyerName, listingTitle, transactionId) => {
  return send(
    to,
    `Transaction validée par ${buyerName}`,
    baseTemplate(`
      <div class="chip">Transaction confirmée</div>
      <h2>L'échange a bien eu lieu !</h2>
      <p>Bonjour <strong>${recipientName}</strong>,</p>
      <p><strong>${buyerName}</strong> a confirmé la transaction pour <strong>"${listingTitle}"</strong>.</p>
      <p>Vous pouvez maintenant vous laisser des avis mutuellement depuis votre profil.</p>
      <a class="btn" href="${BASE}/profile">Laisser un avis</a>
    `)
  )
}
