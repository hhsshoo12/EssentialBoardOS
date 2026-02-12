import { Router } from 'express'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = join(__dirname, '..', 'data', 'apps')

const router = Router()

// Helper to prevent path traversal
function safeId(id) {
    if (!id || typeof id !== 'string') return null
    // Remove any path separators and dots that could lead to traversal
    const sanitized = id.replace(/[\/\.\\]/g, '')
    return sanitized || null
}

/* ── GET /api/apps — 전체 앱 목록 ── */
router.get('/', async (req, res, next) => {
    try {
        const files = await fs.readdir(DATA_DIR)
        const apps = []

        for (const file of files) {
            if (!file.endsWith('.json')) continue
            try {
                const data = await fs.readFile(join(DATA_DIR, file), 'utf-8')
                const app = JSON.parse(data)
                apps.push({
                    id: app.id,
                    name: app.name,
                    version: app.version,
                    createdAt: app.createdAt,
                    updatedAt: app.updatedAt,
                    uiCount: app.uiComponents?.length || 0,
                    nodeCount: app.nodes?.length || 0,
                })
            } catch { /* skip invalid files */ }
        }

        apps.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        res.json(apps)
    } catch (err) { next(err) }
})

/* ── GET /api/apps/:id — 앱 상세 ── */
router.get('/:id', async (req, res, next) => {
    try {
        const id = safeId(req.params.id)
        if (!id) return res.status(400).json({ error: 'Invalid ID' })

        const filePath = join(DATA_DIR, `${id}.json`)
        const data = await fs.readFile(filePath, 'utf-8')
        res.json(JSON.parse(data))
    } catch (err) {
        if (err.code === 'ENOENT') return res.status(404).json({ error: 'App not found' })
        next(err)
    }
})

/* ── POST /api/apps — 앱 저장 ── */
router.post('/', async (req, res, next) => {
    try {
        const app = req.body
        if (!app.id || !app.name) {
            return res.status(400).json({ error: 'id and name are required' })
        }
        const id = safeId(app.id)
        if (!id) return res.status(400).json({ error: 'Invalid ID' })
        app.id = id

        app.updatedAt = new Date().toISOString()
        if (!app.createdAt) app.createdAt = app.updatedAt

        const filePath = join(DATA_DIR, `${app.id}.json`)
        await fs.writeFile(filePath, JSON.stringify(app, null, 2), 'utf-8')
        res.json({ success: true, id: app.id })
    } catch (err) { next(err) }
})

/* ── PUT /api/apps/:id — 앱 수정 ── */
router.put('/:id', async (req, res, next) => {
    try {
        const id = safeId(req.params.id)
        if (!id) return res.status(400).json({ error: 'Invalid ID' })

        const app = req.body
        app.id = id
        app.updatedAt = new Date().toISOString()

        const filePath = join(DATA_DIR, `${app.id}.json`)
        await fs.writeFile(filePath, JSON.stringify(app, null, 2), 'utf-8')
        res.json({ success: true, id: app.id })
    } catch (err) { next(err) }
})

/* ── DELETE /api/apps/:id — 앱 삭제 ── */
router.delete('/:id', async (req, res, next) => {
    try {
        const id = safeId(req.params.id)
        if (!id) return res.status(400).json({ error: 'Invalid ID' })

        const filePath = join(DATA_DIR, `${id}.json`)
        await fs.unlink(filePath)
        res.json({ success: true })
    } catch (err) {
        if (err.code === 'ENOENT') return res.status(404).json({ error: 'App not found' })
        next(err)
    }
})

/* ── GET /api/apps/:id/export — JSON 파일 다운로드 ── */
router.get('/:id/export', async (req, res, next) => {
    try {
        const id = safeId(req.params.id)
        if (!id) return res.status(400).json({ error: 'Invalid ID' })

        const filePath = join(DATA_DIR, `${id}.json`)
        const data = await fs.readFile(filePath, 'utf-8')
        const app = JSON.parse(data)
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', `attachment; filename="${app.name || 'app'}.json"`)
        res.send(data)
    } catch (err) {
        if (err.code === 'ENOENT') return res.status(404).json({ error: 'App not found' })
        next(err)
    }
})

/* ── POST /api/apps/import — JSON 업로드 ── */
router.post('/import', async (req, res, next) => {
    try {
        const app = req.body
        if (!app.name || !app.uiComponents || !app.nodes) {
            return res.status(400).json({ error: 'Invalid app format' })
        }
        if (!app.id) app.id = `app_${Date.now()}`
        const id = safeId(app.id)
        if (!id) return res.status(400).json({ error: 'Invalid ID' })
        app.id = id

        app.updatedAt = new Date().toISOString()

        const filePath = join(DATA_DIR, `${app.id}.json`)
        await fs.writeFile(filePath, JSON.stringify(app, null, 2), 'utf-8')
        res.json({ success: true, id: app.id })
    } catch (err) { next(err) }
})

export default router
