require('dotenv').config()

// ── Vérification des variables d'environnement requises ──────
const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'FRONTEND_URL']
const missing = REQUIRED_ENV.filter(k => !process.env[k])
if (missing.length > 0) {
  console.error('❌ Variables d\'environnement manquantes :', missing.join(', '))
  console.error('   Créez un fichier .env avec ces variables.')
  process.exit(1)
}

const express    = require('express')
const http       = require('http')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const rateLimit  = require('express-rate-limit')
const { Server } = require('socket.io')

const app    = express()
const server = http.createServer(app)

// ── Socket.io ────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})
require('./socket/socketHandler')(io)

// Injecter io dans le controller de conversations pour les émissions temps réel
const convCtrl = require('./controllers/conversationController')
convCtrl.setIo(io)

// ── Middleware globaux ───────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { error: 'Trop de requêtes, réessayez plus tard.' }
}))

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'))
app.use('/api/users',         require('./routes/users'))
app.use('/api/listings',      require('./routes/listings'))
app.use('/api/categories',    require('./routes/categories'))
app.use('/api/brands',        require('./routes/brands'))
app.use('/api/conversations', require('./routes/conversations'))
app.use('/api/messages',      require('./routes/messages'))
app.use('/api/reviews',       require('./routes/reviews'))
app.use('/api/reports',       require('./routes/reports'))
app.use('/api/admin',         require('./routes/admin'))

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }))

// 404
app.use((req, res) => res.status(404).json({ error: 'Route introuvable' }))

// Gestion des erreurs globale
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Erreur interne du serveur'

  // Log structuré pour identification facile
  console.error(`[${new Date().toISOString()}] ${status} ${req.method} ${req.path}`)
  console.error('  Message:', message)
  if (err.stack) console.error('  Stack:', err.stack.split('\n').slice(0, 3).join('\n'))

  res.status(status).json({
    error: status === 500 ? 'Erreur interne du serveur' : message,
    // En développement, exposer plus de détails
    ...(process.env.NODE_ENV !== 'production' && { detail: message })
  })
})

// ── Démarrage ───────────────────────────────────────────────
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 WantIt API démarrée sur http://localhost:${PORT}`)
})

module.exports = { app, io }
