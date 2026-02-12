import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises'

import appsRouter from './routes/apps.js'
import weatherRouter from './routes/weather.js'
import geminiRouter from './routes/gemini.js'
import notesRouter from './routes/notes.js'
import proxyRouter from './routes/proxy.js'

config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

/* ── Middleware ── */
app.use(cors())
app.use(express.json({ limit: '10mb' }))

/* ── Ensure data directories exist ── */
async function ensureDataDirs() {
    const dirs = ['data/apps', 'data/notes']
    for (const dir of dirs) {
        await fs.mkdir(join(__dirname, dir), { recursive: true })
    }
}

/* ── Authentication Middleware ── */
const API_KEY = process.env.EBOS_API_KEY || 'ebos_secret_key_1234'
app.use('/api', (req, res, next) => {
    if (req.path === '/health') return next()
    const key = req.headers['x-api-key']
    if (key === API_KEY) return next()
    res.status(401).json({ error: 'Unauthorized: Missing or invalid API Key' })
})

/* ── API Routes ── */
app.use('/api/apps', appsRouter)
app.use('/api/weather', weatherRouter)
app.use('/api/gemini', geminiRouter)
app.use('/api/notes', notesRouter)
app.use('/api/proxy', proxyRouter)

/* ── Health Check ── */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    })
})

/* ── Error Handler ── */
app.use((err, req, res, next) => {
    console.error(`[Error] ${err.message}`)
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    })
})

/* ── Start ── */
ensureDataDirs().then(() => {
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════╗
║   EssentialBoardOS Server v1.0        ║
║   Running on http://localhost:${PORT}    ║
╚═══════════════════════════════════════╝
    `)
    })
})
