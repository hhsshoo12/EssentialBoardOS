import { Router } from 'express'

const router = Router()

/* ── POST /api/gemini/chat — Gemini API 프록시 ── */
router.post('/chat', async (req, res, next) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            return res.json({
                fallback: true,
                response: 'Gemini API 키가 설정되지 않았습니다. server/.env 파일에서 GEMINI_API_KEY를 설정해주세요.',
            })
        }

        const { prompt, history = [] } = req.body
        if (!prompt) {
            return res.status(400).json({ error: 'prompt is required' })
        }

        // Build Gemini API request
        const contents = []

        // Add conversation history
        history.forEach(msg => {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }],
            })
        })

        // Add current prompt
        contents.push({
            role: 'user',
            parts: [{ text: prompt }],
        })

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                },
            }),
        })

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            throw new Error(`Gemini API error: ${response.status} - ${errData.error?.message || 'Unknown'}`)
        }

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 받지 못했습니다.'

        res.json({ response: text })
    } catch (err) { next(err) }
})

export default router
