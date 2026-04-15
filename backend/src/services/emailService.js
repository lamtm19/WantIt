const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM || 'WantIt <noreply@wantit.app>'
const BASE   = process.env.FRONTEND_URL || 'http://localhost:5173'

async function send(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email simulé] À: ${to} | Sujet: ${subject}`)
    return
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('Email error:', err)
  }
}

function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .card { background: white; border-radius: 12px; padding: 32px; max-width: 560px; margin: 0 auto; }
    .logo { font-size: 28px; font-weight: 800; color: #09b668; margin-bottom: 24px; }
    h2 { color: #1a1a1a; margin: 0 0 16px; }
    p { color: #555; line-height: 1.6; }
    .btn {
      display: inline-block; background: #09b668; color: white;
      padding: 12px 24px; border-radius: 8px; text-decoration: none;
      font-weight: 600; margin: 16px 0;
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
      Les transactions se font en main propre. Nous ne sommes pas responsables
      des paiements ou échanges.<br><br>
      © ${new Date().getFullYear()} WantIt
    </div>
  </div>
</body>
</html>`
}

exports.sendNewMessageEmail = async (to, recipientName, senderName, listingTitle, conversationId) => {
  await send(
    to,
    `💬 Nouveau message de ${senderName}`,
    baseTemplate(`
      <h2>Nouveau message</h2>
      <p>Bonjour <strong>${recipientName}</strong>,</p>
      <p><strong>${senderName}</strong> vous a envoyé un message concernant votre annonce
        <strong>"${listingTitle}"</strong>.</p>
      <a class="btn" href="${BASE}/messages/${conversationId}">Voir le message</a>
    `)
  )
}

exports.sendNewOfferEmail = async (to, recipientName, senderName, listingTitle, amount, conversationId) => {
  await send(
    to,
    `💰 Nouvelle offre de ${senderName}`,
    baseTemplate(`
      <h2>Nouvelle offre reçue</h2>
      <p>Bonjour <strong>${recipientName}</strong>,</p>
      <p><strong>${senderName}</strong> vous propose <strong>${amount} €</strong>
        pour votre annonce <strong>"${listingTitle}"</strong>.</p>
      <a class="btn" href="${BASE}/messages/${conversationId}">Répondre à l'offre</a>
    `)
  )
}

exports.sendNewReviewEmail = async (to, recipientName, reviewerName, rating, listingTitle) => {
  const stars = '⭐'.repeat(rating)
  await send(
    to,
    `⭐ Nouvel avis de ${reviewerName}`,
    baseTemplate(`
      <h2>Vous avez reçu un avis</h2>
      <p>Bonjour <strong>${recipientName}</strong>,</p>
      <p><strong>${reviewerName}</strong> vous a laissé un avis ${stars} après la transaction
        concernant <strong>"${listingTitle}"</strong>.</p>
      <a class="btn" href="${BASE}/profile">Voir mon profil</a>
    `)
  )
}

exports.sendTransactionValidatedEmail = async (to, recipientName, buyerName, listingTitle, transactionId) => {
  await send(
    to,
    `✅ Transaction validée par ${buyerName}`,
    baseTemplate(`
      <h2>Transaction validée !</h2>
      <p>Bonjour <strong>${recipientName}</strong>,</p>
      <p><strong>${buyerName}</strong> a confirmé la transaction pour
        <strong>"${listingTitle}"</strong>.</p>
      <p>Vous pouvez maintenant laisser un avis.</p>
      <a class="btn" href="${BASE}/profile">Laisser un avis</a>
    `)
  )
}
