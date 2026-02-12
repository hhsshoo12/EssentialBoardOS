import { useState, useEffect } from 'react'
import './LifeProgress.css'

function LifeProgress() {
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const year = now.getFullYear()
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    const daysInYear = isLeapYear ? 366 : 365

    /* ── Progress Items ── */
    const todayStart = new Date(year, now.getMonth(), now.getDate())
    const todayMs = now - todayStart
    const dayProgress = (todayMs / 86400000) * 100

    const monthStart = new Date(year, now.getMonth(), 1)
    const monthEnd = new Date(year, now.getMonth() + 1, 0)
    const monthDays = monthEnd.getDate()
    const monthProgress = ((now.getDate() - 1 + todayMs / 86400000) / monthDays) * 100

    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year + 1, 0, 1)
    const yearProgress = ((now - yearStart) / (yearEnd - yearStart)) * 100

    /* ── Week progress (Mon=start) ── */
    const dayOfWeek = (now.getDay() + 6) % 7 // Mon=0
    const weekProgress = ((dayOfWeek + todayMs / 86400000) / 7) * 100

    /* ── Life progress (average lifespan ~80 years) ── */
    const birthYear = year - 20 // placeholder, show generic
    const avgLifespan = 80
    const ageApprox = year - 2005 // generic placeholder
    const lifeProgress = Math.min(100, (ageApprox / avgLifespan) * 100)

    const bars = [
        { label: '오늘', emoji: '☀️', value: dayProgress, color: '#7c6ff7', sub: `${Math.floor(now.getHours())}시 ${now.getMinutes()}분` },
        { label: '이번 주', emoji: '📅', value: weekProgress, color: '#6c5ce7', sub: `${dayOfWeek + 1}일째` },
        { label: `${now.getMonth() + 1}월`, emoji: '🗓️', value: monthProgress, color: '#a78bfa', sub: `${now.getDate()}일 / ${monthDays}일` },
        { label: `${year}년`, emoji: '🌍', value: yearProgress, color: '#e879f9', sub: `${Math.floor((now - yearStart) / 86400000) + 1}일 / ${daysInYear}일` },
    ]

    return (
        <div className="life-progress">
            <div className="lp-header">
                <h2 className="lp-title">⏳ Life Progress</h2>
                <p className="lp-subtitle">시간은 멈추지 않아요</p>
            </div>
            <div className="lp-bars">
                {bars.map((bar, i) => (
                    <div key={i} className="lp-item">
                        <div className="lp-item-header">
                            <span className="lp-item-emoji">{bar.emoji}</span>
                            <span className="lp-item-label">{bar.label}</span>
                            <span className="lp-item-pct">{bar.value.toFixed(1)}%</span>
                        </div>
                        <div className="lp-bar-track">
                            <div
                                className="lp-bar-fill"
                                style={{ width: `${Math.min(100, bar.value)}%`, background: bar.color }}
                            />
                        </div>
                        <div className="lp-item-sub">{bar.sub}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default LifeProgress
