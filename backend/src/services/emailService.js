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
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .card { background: white; border-radius: 12px; padding: 32px; max-width: 560px; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { font-size: 28px; font-weight: 800; color: #09b668; margin-bottom: 24px; }
    h2 { color: #1a1a1a; margin: 0 0 16px; font-size: 20px; }
    p { color: #555; line-height: 1.6; margin: 0 0 12px; }
    .btn {
      display: inline-block; background: #09b668; color: white !important;
      padding: 12px 24px; border-radius: 8px; text-decoration: none;
      font-weight: 600; margin: 16px 0; font-size: 15px;
    }
    .footer { margin-top: 24px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">WantIt</div>
    ${content}
    <div class="footer">
      Cette plateforme met uniquement en relation des utilisateurs.
      Les transactions se font en main propre.<br><br>
      © ${new Date().getFullYear()} WantIt
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
      <h2>Bienvenue sur WantIt, ${username} !</h2>
      <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre compte.</p>
      <a class="btn" href="${confirmationLink}">Confirmer mon compte</a>
      <p style="font-size:12px;color:#999;margin-top:16px;">
        Ce lien expire dans 24h. Si vous n'avez pas créé de compte, ignorez cet email.
      </p>
    `)
  )
}

exports.sendNewMessageEmail = async (to, recipientName, senderName, listingTitle, conversationId) => {
  return send(
    to,
    `Nouveau message de ${senderName}`,
    baseTemplate(`
      <h2>Nouveau message</h2>
      <p>Bonjour <strong>${recipientName}</strong>,</p>
      <p><strong>${senderName}</strong> vous a envoyé un message concernant l'annonce
        <strong>"${listingTitle}"</strong>.</p>
      <a class="btn" href="${BASE}/messages/${conversationId}">Voir le message</a>
    `)
  )
}

exports.sendNewOfferEmail = async (to, recipientName, senderName, listingTitle, amount, conversationId) => {
  return send(
    to,
    `Nouvelle offre de ${senderName}`,
    baseTemplate(`
      <h2>Nouvelle offre reçue</h2>
      <p>Bonjour <strong>${recipientName}</strong>,</p>
      <p><strong>${senderName}</strong> vous propose <strong>${amount} €</strong>
        pour l'annonce <strong>"${listingTitle}"</strong>.</p>
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
      <h2>Vous avez reçu un avis</h2>
      <p>Bonjour <strong>${recipientName}</strong>,</p>
      <p><strong>${reviewerName}</strong> vous a laissé un avis <span style="color:#f59e0b">${stars}</span>
        suite à la transaction concernant <strong>"${listingTitle}"</strong>.</p>
      <a class="btn" href="${BASE}/profile">Voir mon profil</a>
    `)
  )
}

exports.sendTransactionValidatedEmail = async (to, recipientName, buyerName, listingTitle, transactionId) => {
  return send(
    to,
    `Transaction validée par ${buyerName}`,
    baseTemplate(`
      <h2>Transaction validée !</h2>
      <p>Bonjour <strong>${recipientName}</strong>,</p>
      <p><strong>${buyerName}</strong> a confirmé la transaction pour
        <strong>"${listingTitle}"</strong>.</p>
      <p>Vous pouvez maintenant laisser un avis mutuellement.</p>
      <a class="btn" href="${BASE}/profile">Laisser un avis</a>
    `)
  )
}
