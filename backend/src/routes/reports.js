const express = require('express')
const router  = express.Router()

// Fonctionnalité de signalement désactivée temporairement
router.use((_req, res) => res.status(501).json({ error: 'Fonctionnalité non disponible' }))

module.exports = router
