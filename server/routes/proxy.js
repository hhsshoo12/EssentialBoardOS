import { Router } from 'express'

const router = Router()

// Allowed domains whitelist (optional, for security)
const BLOCKED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
]

function isBlockedHost(url) {
    try {
        const parsed = new URL(url)
        // Protocol check
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true

        const hostname = parsed.hostname.toLowerCase()

        // Exact block
        if (BLOCKED_HOSTS.includes(hostname)) return true

        // Private network IP ranges
        if (hostname.startsWith('10.')) return true
        if (hostname.startsWith('192.168.')) return true
        if (hostname.startsWith('127.')) return true

        const parts = hostname.split('.')
        if (parts.length === 4 && parts[0] === '172') {
            const second = parseInt(parts[1], 10)
            if (second >= 16 && second <= 31) return true
        }

        return false
    } catch {
        return true
    }
}

/**
 * POST /api/proxy
 * 
 * Body:
 *   url      (string, required) — Target URL
 *   method   (string) — GET, POST, PUT, DELETE, PATCH (default: GET)
 *   headers  (object) — Custom headers
 *   body     (string|object) — Request body (for POST/PUT/PATCH)
 *   jsonPath (string) — Optional JSON path to extract (e.g. "data.items[0].name")
 */
router.post('/', async (req, res, next) => {
    try {
        const { url, method = 'GET', headers = {}, body, jsonPath } = req.body

        if (!url) {
            return res.status(400).json({ error: 'url is required' })
        }

        // Security: block internal network requests
        if (isBlockedHost(url)) {
            return res.status(403).json({ error: 'Internal network requests are not allowed' })
        }

        // Build fetch options
        const fetchOptions = {
            method: method.toUpperCase(),
            headers: {
                'User-Agent': 'EssentialBoardOS/1.0',
                ...headers,
            },
        }

        // Add body for non-GET requests
        if (body && method.toUpperCase() !== 'GET') {
            if (typeof body === 'object') {
                fetchOptions.body = JSON.stringify(body)
                fetchOptions.headers['Content-Type'] = fetchOptions.headers['Content-Type'] || 'application/json'
            } else {
                fetchOptions.body = String(body)
            }
        }

        // Execute request with timeout
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout
        fetchOptions.signal = controller.signal

        const response = await fetch(url, fetchOptions)
        clearTimeout(timeout)

        const contentType = response.headers.get('content-type') || ''
        let responseData

        if (contentType.includes('application/json')) {
            responseData = await response.json()
        } else {
            responseData = await response.text()
        }

        // Optional: extract using jsonPath (simple dot notation)
        let extracted = responseData
        if (jsonPath && typeof responseData === 'object') {
            try {
                extracted = jsonPath.split('.').reduce((obj, key) => {
                    // Handle array notation like "items[0]"
                    const match = key.match(/^(.+)\[(\d+)\]$/)
                    if (match) {
                        return obj?.[match[1]]?.[Number(match[2])]
                    }
                    return obj?.[key]
                }, responseData)
            } catch {
                extracted = responseData
            }
        }

        res.json({
            status: response.status,
            statusText: response.statusText,
            data: extracted,
            isJson: contentType.includes('application/json'),
        })
    } catch (err) {
        if (err.name === 'AbortError') {
            return res.status(408).json({ error: '요청 시간 초과 (10초)' })
        }
        next(err)
    }
})

export default router
