import { Router } from 'express'

const router = Router()

/**
 * WMO Weather Codes → 한국어 설명 + 이모지
 */
const WMO_CODES = {
    0: { desc: '맑음', icon: '☀️' },
    1: { desc: '대체로 맑음', icon: '🌤️' },
    2: { desc: '구름 조금', icon: '⛅' },
    3: { desc: '흐림', icon: '☁️' },
    45: { desc: '안개', icon: '🌫️' },
    48: { desc: '상고대 안개', icon: '🌫️' },
    51: { desc: '이슬비 (약)', icon: '🌦️' },
    53: { desc: '이슬비', icon: '🌦️' },
    55: { desc: '이슬비 (강)', icon: '🌧️' },
    61: { desc: '비 (약)', icon: '🌧️' },
    63: { desc: '비', icon: '🌧️' },
    65: { desc: '비 (강)', icon: '🌧️' },
    71: { desc: '눈 (약)', icon: '❄️' },
    73: { desc: '눈', icon: '❄️' },
    75: { desc: '눈 (강)', icon: '❄️' },
    77: { desc: '싸락눈', icon: '🌨️' },
    80: { desc: '소나기 (약)', icon: '🌦️' },
    81: { desc: '소나기', icon: '🌧️' },
    82: { desc: '소나기 (강)', icon: '🌧️' },
    85: { desc: '눈보라 (약)', icon: '🌨️' },
    86: { desc: '눈보라', icon: '🌨️' },
    95: { desc: '뇌우', icon: '⛈️' },
    96: { desc: '우박 뇌우 (약)', icon: '⛈️' },
    99: { desc: '우박 뇌우', icon: '⛈️' },
}

function getWeatherInfo(code) {
    return WMO_CODES[code] || { desc: '알 수 없음', icon: '🌤️' }
}

/* ── GET /api/weather?lat=&lon= — Open-Meteo 위치 기반 날씨 ── */
router.get('/', async (req, res, next) => {
    try {
        const { lat = 37.5665, lon = 126.9780 } = req.query

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,cloud_cover&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`

        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Open-Meteo API error: ${response.status}`)
        }

        const data = await response.json()
        const current = data.current
        const daily = data.daily
        const weatherInfo = getWeatherInfo(current.weather_code)

        res.json({
            temp: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            tempMin: daily?.temperature_2m_min?.[0] != null ? Math.round(daily.temperature_2m_min[0]) : null,
            tempMax: daily?.temperature_2m_max?.[0] != null ? Math.round(daily.temperature_2m_max[0]) : null,
            humidity: current.relative_humidity_2m,
            description: weatherInfo.desc,
            icon: weatherInfo.icon,
            wind: current.wind_speed_10m,
            clouds: current.cloud_cover,
            sunrise: daily?.sunrise?.[0] || null,
            sunset: daily?.sunset?.[0] || null,
            city: null,  // Open-Meteo doesn't return city name
        })
    } catch (err) { next(err) }
})

/* ── GET /api/weather/city?q= — 도시명 → 좌표 → 날씨 ── */
router.get('/city', async (req, res, next) => {
    try {
        const { q = 'Seoul' } = req.query

        // Step 1: Geocode city name
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=ko`
        const geoRes = await fetch(geoUrl)
        const geoData = await geoRes.json()

        if (!geoData.results?.length) {
            return res.status(404).json({ error: `도시를 찾을 수 없습니다: ${q}` })
        }

        const { latitude, longitude, name } = geoData.results[0]

        // Step 2: Get weather
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`Open-Meteo API error: ${response.status}`)
        }

        const data = await response.json()
        const current = data.current
        const weatherInfo = getWeatherInfo(current.weather_code)

        res.json({
            temp: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m,
            description: weatherInfo.desc,
            icon: weatherInfo.icon,
            city: name,
            wind: current.wind_speed_10m,
        })
    } catch (err) { next(err) }
})

export default router
