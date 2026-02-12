import { useState, useCallback, useEffect } from 'react'
import { MdAdd, MdDelete, MdNotifications } from 'react-icons/md'
import './DDay.css'

const STORAGE_KEY = 'ebos-dday'

function DDay() {
    const [events, setEvents] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            return saved ? JSON.parse(saved) : [
                { id: 1, title: '새해', date: `${new Date().getFullYear() + 1}-01-01`, color: '#e879f9' },
            ]
        } catch { return [] }
    })

    const [showForm, setShowForm] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newDate, setNewDate] = useState('')
    const [newColor, setNewColor] = useState('#7c6ff7')

    const save = useCallback((updated) => {
        setEvents(updated)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }, [])

    const addEvent = useCallback(() => {
        if (!newTitle.trim() || !newDate) return
        const ev = {
            id: Date.now(),
            title: newTitle.trim(),
            date: newDate,
            color: newColor,
        }
        save([...events, ev])
        setNewTitle('')
        setNewDate('')
        setShowForm(false)
    }, [newTitle, newDate, newColor, events, save])

    const deleteEvent = useCallback((id) => {
        save(events.filter(e => e.id !== id))
    }, [events, save])

    const getDday = (dateStr) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const target = new Date(dateStr)
        target.setHours(0, 0, 0, 0)
        const diff = Math.ceil((target - today) / 86400000)
        return diff
    }

    const sortedEvents = [...events].sort((a, b) => {
        return Math.abs(getDday(a.date)) - Math.abs(getDday(b.date))
    })

    const COLORS = ['#7c6ff7', '#6c5ce7', '#a78bfa', '#e879f9', '#f97316', '#22d3ee', '#4ade80', '#fb7185']

    return (
        <div className="dday">
            <div className="dday-header">
                <h2 className="dday-title">📌 D-Day</h2>
                <button className="dday-add-btn" onClick={() => setShowForm(v => !v)}>
                    <MdAdd size={18} />
                </button>
            </div>

            {showForm && (
                <div className="dday-form">
                    <input
                        className="dday-input"
                        type="text"
                        placeholder="이벤트 이름"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                    />
                    <input
                        className="dday-input"
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                    />
                    <div className="dday-colors">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                className={`dday-color-btn ${newColor === c ? 'active' : ''}`}
                                style={{ background: c }}
                                onClick={() => setNewColor(c)}
                            />
                        ))}
                    </div>
                    <button className="dday-submit-btn" onClick={addEvent}>추가</button>
                </div>
            )}

            <div className="dday-list">
                {sortedEvents.length === 0 ? (
                    <div className="dday-empty">
                        <p>등록된 D-Day가 없습니다</p>
                        <p style={{ fontSize: 12, opacity: 0.5 }}>+ 버튼을 눌러 추가하세요</p>
                    </div>
                ) : (
                    sortedEvents.map(ev => {
                        const diff = getDday(ev.date)
                        const isPast = diff < 0
                        const isToday = diff === 0
                        const label = isToday ? 'D-Day!' : (diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`)

                        return (
                            <div key={ev.id} className={`dday-card ${isPast ? 'past' : ''} ${isToday ? 'today' : ''}`}>
                                <div className="dday-card-accent" style={{ background: ev.color }} />
                                <div className="dday-card-body">
                                    <div className="dday-card-title">{ev.title}</div>
                                    <div className="dday-card-date">{ev.date}</div>
                                </div>
                                <div className="dday-card-count" style={{ color: isToday ? '#fbbf24' : ev.color }}>
                                    {label}
                                </div>
                                <button className="dday-card-delete" onClick={() => deleteEvent(ev.id)}>
                                    <MdDelete size={14} />
                                </button>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default DDay
