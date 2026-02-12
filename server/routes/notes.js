import { Router } from 'express'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = join(__dirname, '..', 'data', 'notes')

const router = Router()

// Helper to prevent path traversal
function safeId(id) {
    if (!id || typeof id !== 'string') return null
    // Remove any path separators and dots that could lead to traversal
    const sanitized = id.replace(/[\/\.\\]/g, '')
    return sanitized || null
}

/* ── GET /api/notes — 노트 목록 ── */
router.get('/', async (req, res, next) => {
    try {
        const files = await fs.readdir(DATA_DIR)
        const notes = []

        for (const file of files) {
            if (!file.endsWith('.json')) continue
            try {
                const data = await fs.readFile(join(DATA_DIR, file), 'utf-8')
                const note = JSON.parse(data)
                notes.push(note)
            } catch { /* skip */ }
        }

        notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        res.json(notes)
    } catch (err) { next(err) }
})

/* ── GET /api/notes/:id — 노트 상세 ── */
router.get('/:id', async (req, res, next) => {
    try {
        const id = safeId(req.params.id)
        if (!id) return res.status(400).json({ error: 'Invalid ID' })

        const filePath = join(DATA_DIR, `${id}.json`)
        const data = await fs.readFile(filePath, 'utf-8')
        res.json(JSON.parse(data))
    } catch (err) {
        if (err.code === 'ENOENT') return res.status(404).json({ error: 'Note not found' })
        next(err)
    }
})

/* ── POST /api/notes — 노트 저장 ── */
router.post('/', async (req, res, next) => {
    try {
        const note = req.body
        if (!note.title && !note.content) {
            return res.status(400).json({ error: 'title or content is required' })
        }

        if (!note.id) note.id = `note_${Date.now()}`
        const id = safeId(note.id)
        if (!id) return res.status(400).json({ error: 'Invalid ID' })
        note.id = id

        note.updatedAt = new Date().toISOString()
        if (!note.createdAt) note.createdAt = note.updatedAt

        const filePath = join(DATA_DIR, `${note.id}.json`)
        await fs.writeFile(filePath, JSON.stringify(note, null, 2), 'utf-8')
        res.json({ success: true, id: note.id })
    } catch (err) { next(err) }
})

/* ── PUT /api/notes/:id — 노트 수정 ── */
router.put('/:id', async (req, res, next) => {
    try {
        const id = safeId(req.params.id)
        if (!id) return res.status(400).json({ error: 'Invalid ID' })

        const note = req.body
        note.id = id
        note.updatedAt = new Date().toISOString()

        const filePath = join(DATA_DIR, `${note.id}.json`)
        await fs.writeFile(filePath, JSON.stringify(note, null, 2), 'utf-8')
        res.json({ success: true, id: note.id })
    } catch (err) { next(err) }
})

/* ── DELETE /api/notes/:id — 노트 삭제 ── */
router.delete('/:id', async (req, res, next) => {
    try {
        const id = safeId(req.params.id)
        if (!id) return res.status(400).json({ error: 'Invalid ID' })

        const filePath = join(DATA_DIR, `${id}.json`)
        await fs.unlink(filePath)
        res.json({ success: true })
    } catch (err) {
        if (err.code === 'ENOENT') return res.status(404).json({ error: 'Note not found' })
        next(err)
    }
})

export default router
