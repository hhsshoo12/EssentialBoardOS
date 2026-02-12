import { useState, useEffect } from 'react'
import { ebosFetch } from '../api'
import './ClockWeather.css'

const DAYS_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

function ClockWeather({ settings }) {
    const [time, setTime] = useState(new Date())
    const [weather, setWeather] = useState(null)
    const [weatherError, setWeatherError] = useState(false)

    // Fetch weather
    useEffect(() => {
        async function fetchWeather() {
            setWeatherError(false)
            try {
                if (settings?.mode === 'manual' && settings?.city) {
                    const res = await ebosFetch(`/api/weather/city?q=${encodeURIComponent(settings.city)}`)
                    if (res.ok) {
                        setWeather(await res.json())
                    } else {
                        throw new Error('City not found')
                    }
                } else if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                            try {
                                const res = await ebosFetch(`/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
                                if (res.ok) {
                                    setWeather(await res.json())
                                } else {
                                    throw new Error('API error')
                                }
                            } catch {
                                fallbackFetch()
                            }
                        },
                        () => fallbackFetch(),
                        { timeout: 5000 }
                    )
                } else {
                    fallbackFetch()
                }
            } catch (err) {
                console.error('Weather error:', err)
                setWeatherError(true)
            }
        }

        async function fallbackFetch() {
            try {
                const res = await ebosFetch('/api/weather?lat=37.5665&lon=126.9780')
                if (res.ok) {
                    setWeather(await res.json())
                } else {
                    setWeatherError(true)
                }
            } catch {
                setWeatherError(true)
            }
        }

        fetchWeather()
        const interval = setInterval(fetchWeather, 600000)
        return () => clearInterval(interval)
    }, [settings])

    const hours = String(time.getHours()).padStart(2, '0')
    const minutes = String(time.getMinutes()).padStart(2, '0')
    const seconds = String(time.getSeconds()).padStart(2, '0')

    const year = time.getFullYear()
    const month = time.getMonth() + 1
    const date = time.getDate()
    const day = DAYS_KO[time.getDay()]

    const weatherIcon = weather?.icon || '⛅'
    const temp = weather?.temp ?? '--'
    const desc = weather?.description ?? '날씨 로딩중...'
    const humidity = weather?.humidity ?? '--'
    const wind = weather?.wind ?? '--'
    const city = weather?.city

    return (
        <div className="clock-weather">
            <div className="clock-section">
                <div className="clock-time">
                    {hours}:{minutes}
                    <span className="clock-seconds">{seconds}</span>
                </div>
                <div className="clock-date">
                    {year}년 {month}월 {date}일 <span className="clock-day">{day}</span>
                </div>
            </div>

            <div className="weather-section">
                <span className="weather-icon">{weatherIcon}</span>
                <div className="weather-info">
                    <span className="weather-temp">{temp}°C</span>
                    <span className="weather-desc">{desc}{city ? ` · ${city}` : ''}</span>
                    <div className="weather-detail">
                        <span>💧 {humidity}%</span>
                        <span>💨 {wind}km/h</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ClockWeather
