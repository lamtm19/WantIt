require('dotenv').config()
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

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Erreur interne du serveur' })
})

// ── Démarrage ───────────────────────────────────────────────
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 WantIt API démarrée sur http://localhost:${PORT}`)
})

module.exports = { app, io }
