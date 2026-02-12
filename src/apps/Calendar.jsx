import { useState, useCallback, useMemo } from 'react'
import {
    MdChevronLeft,
    MdChevronRight,
    MdAdd,
    MdClose,
    MdDelete,
} from 'react-icons/md'
import './Calendar.css'

const STORAGE_KEY = 'ebos-calendar-events'
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const COLORS = ['purple', 'blue', 'green', 'red', 'orange']
const COLOR_HEX = {
    purple: '#7c6ff7',
    blue: '#74b9ff',
    green: '#00ce9a',
    red: '#ff6b6b',
    orange: '#fdcb6e',
}

function getEvents() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
    catch { return [] }
}
function saveEvents(events) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay()
}

function Calendar() {
    const today = new Date()
    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [currentMonth, setCurrentMonth] = useState(today.getMonth())
    const [selectedDate, setSelectedDate] = useState(null)
    const [showModal, setShowModal] = useState(false)
    const [newEvent, setNewEvent] = useState({ title: '', color: 'purple' })
    const [events, setEvents] = useState(getEvents)

    /* ── Navigation ── */
    const prevMonth = useCallback(() => {
        setCurrentMonth(prev => {
            if (prev === 0) { setCurrentYear(y => y - 1); return 11 }
            return prev - 1
        })
    }, [])

    const nextMonth = useCallback(() => {
        setCurrentMonth(prev => {
            if (prev === 11) { setCurrentYear(y => y + 1); return 0 }
            return prev + 1
        })
    }, [])

    const goToday = useCallback(() => {
        setCurrentYear(today.getFullYear())
        setCurrentMonth(today.getMonth())
        setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)
    }, [today])

    /* ── Calendar Grid ── */
    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth)
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
        const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1)
        const days = []

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i
            const m = currentMonth === 0 ? 12 : currentMonth
            const y = currentMonth === 0 ? currentYear - 1 : currentYear
            days.push({ day, month: m - 1, year: y, otherMonth: true })
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            days.push({ day: d, month: currentMonth, year: currentYear, otherMonth: false })
        }

        // Next month days
        const remaining = 42 - days.length
        for (let d = 1; d <= remaining; d++) {
            const m = currentMonth === 11 ? 0 : currentMonth + 1
            const y = currentMonth === 11 ? currentYear + 1 : currentYear
            days.push({ day: d, month: m, year: y, otherMonth: true })
        }

        return days
    }, [currentYear, currentMonth])

    /* ── Date Helpers ── */
    const dateKey = (y, m, d) =>
        `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    const isToday = (y, m, d) =>
        y === today.getFullYear() && m === today.getMonth() && d === today.getDate()

    const getDayOfWeek = (y, m, d) => new Date(y, m, d).getDay()

    /* ── Events ── */
    const eventsByDate = useMemo(() => {
        const map = {}
        events.forEach(e => {
            if (!map[e.date]) map[e.date] = []
            map[e.date].push(e)
        })
        return map
    }, [events])

    const handleDayClick = useCallback((dayInfo) => {
        const key = dateKey(dayInfo.year, dayInfo.month, dayInfo.day)
        setSelectedDate(key)
    }, [])

    const handleAddEvent = useCallback(() => {
        if (!selectedDate) return
        setNewEvent({ title: '', color: 'purple' })
        setShowModal(true)
    }, [selectedDate])

    const handleSaveEvent = useCallback(() => {
        if (!newEvent.title.trim() || !selectedDate) return
        const event = {
            id: Date.now(),
            date: selectedDate,
            title: newEvent.title.trim(),
            color: newEvent.color,
        }
        const updated = [...events, event]
        setEvents(updated)
        saveEvents(updated)
        setShowModal(false)
    }, [newEvent, selectedDate, events])

    const handleDeleteEvent = useCallback((id) => {
        const updated = events.filter(e => e.id !== id)
        setEvents(updated)
        saveEvents(updated)
    }, [events])

    const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : []

    return (
        <div className="calendar" style={{ position: 'relative' }}>
            {/* Toolbar */}
            <div className="cal-toolbar">
                <div className="cal-nav">
                    <button className="cal-nav-btn" onClick={prevMonth}><MdChevronLeft /></button>
                    <span className="cal-month-title">{currentYear}년 {currentMonth + 1}월</span>
                    <button className="cal-nav-btn" onClick={nextMonth}><MdChevronRight /></button>
                    <button className="cal-today-btn" onClick={goToday}>오늘</button>
                </div>
                {selectedDate && (
                    <button className="cal-today-btn" onClick={handleAddEvent} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MdAdd size={16} /> 일정 추가
                    </button>
                )}
            </div>

            {/* Calendar Grid */}
            <div className="cal-grid">
                <div className="cal-weekdays">
                    {WEEKDAYS.map((d, i) => (
                        <div key={d} className={`cal-weekday ${i === 0 ? 'sunday' : ''} ${i === 6 ? 'saturday' : ''}`}>
                            {d}
                        </div>
                    ))}
                </div>
                <div className="cal-days">
                    {calendarDays.map((dayInfo, idx) => {
                        const key = dateKey(dayInfo.year, dayInfo.month, dayInfo.day)
                        const dow = getDayOfWeek(dayInfo.year, dayInfo.month, dayInfo.day)
                        const dayEvents = eventsByDate[key] || []
                        return (
                            <div
                                key={idx}
                                className={[
                                    'cal-day',
                                    dayInfo.otherMonth ? 'other-month' : '',
                                    isToday(dayInfo.year, dayInfo.month, dayInfo.day) ? 'today' : '',
                                    selectedDate === key ? 'selected' : '',
                                    dow === 0 ? 'sunday' : '',
                                    dow === 6 ? 'saturday' : '',
                                ].filter(Boolean).join(' ')}
                                onClick={() => handleDayClick(dayInfo)}
                            >
                                <span className="cal-day-number">{dayInfo.day}</span>
                                {dayEvents.slice(0, 2).map(ev => (
                                    <div key={ev.id} className={`cal-event color-${ev.color}`}>
                                        {ev.title}
                                    </div>
                                ))}
                                {dayEvents.length > 2 && (
                                    <span className="cal-event-more">+{dayEvents.length - 2}개</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Selected Day Events */}
            {selectedDate && selectedEvents.length > 0 && (
                <div className="cal-day-events">
                    <div className="cal-day-events-title">{selectedDate} 일정</div>
                    {selectedEvents.map(ev => (
                        <div key={ev.id} className="cal-day-event-item">
                            <span className="event-dot" style={{ background: COLOR_HEX[ev.color] }} />
                            <span className="event-title">{ev.title}</span>
                            <button className="event-delete" onClick={() => handleDeleteEvent(ev.id)}>
                                <MdDelete />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Event Modal */}
            {showModal && (
                <>
                    <div className="cal-modal-overlay" onClick={() => setShowModal(false)} />
                    <div className="cal-modal">
                        <div className="cal-modal-header">
                            <h3>새 일정</h3>
                            <button className="cal-modal-close" onClick={() => setShowModal(false)}>
                                <MdClose />
                            </button>
                        </div>
                        <div className="cal-modal-body">
                            <div className="cal-modal-field">
                                <label>날짜</label>
                                <input type="text" value={selectedDate} readOnly />
                            </div>
                            <div className="cal-modal-field">
                                <label>제목</label>
                                <input
                                    type="text"
                                    placeholder="일정 제목을 입력하세요"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEvent()}
                                    autoFocus
                                />
                            </div>
                            <div className="cal-modal-field">
                                <label>색상</label>
                                <div className="cal-modal-colors">
                                    {COLORS.map(c => (
                                        <div
                                            key={c}
                                            className={`cal-color-dot ${newEvent.color === c ? 'selected' : ''}`}
                                            style={{ background: COLOR_HEX[c] }}
                                            onClick={() => setNewEvent(prev => ({ ...prev, color: c }))}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="cal-modal-actions">
                                <button className="neu-btn" onClick={() => setShowModal(false)}>취소</button>
                                <button className="neu-btn accent" onClick={handleSaveEvent}>저장</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default Calendar
