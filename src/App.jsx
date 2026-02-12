import { useState, useCallback, useRef, useEffect } from 'react'
import ProgramBar from './components/ProgramBar'
import MainScreen from './components/MainScreen'
import Calculator from './apps/Calculator'
import Settings from './apps/Settings'
import MiniAppRunner from './framework/MiniAppRunner'
import { MdClose, MdDragIndicator, MdApps, MdSettings } from 'react-icons/md'
import { HiPaintBrush } from 'react-icons/hi2'
import {
    MdEditNote,
    MdCalendarMonth,
    MdCalculate,
    MdLanguage,
    MdTimeline,
    MdEvent
} from 'react-icons/md'
import './App.css'

/* ── All Component Metadata for Settings ── */
const ALL_APPS = [
    { id: 'whiteboard', icon: HiPaintBrush, label: '화이트보드' },
    { id: 'notepad', icon: MdEditNote, label: '메모장' },
    { id: 'calendar', icon: MdCalendarMonth, label: '캘린더' },
    { id: 'calculator', icon: MdCalculate, label: '계산기' },
    { id: 'browser', icon: MdLanguage, label: '미니브라우저' },
    { id: 'lifeprogress', icon: MdTimeline, label: '라이프 프로그레스' },
    { id: 'dday', icon: MdEvent, label: 'D-Day' },
    { id: 'settings', icon: MdSettings, label: '설정' },
]

/* ── Pointer helper ── */
const getPointer = (e) => {
    if (e.touches && e.touches.length > 0)
        return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
    return { clientX: e.clientX, clientY: e.clientY }
}

function App() {
    const [activeApp, setActiveApp] = useState(null)
    const [quickNotes, setQuickNotes] = useState(() => {
        try {
            const saved = localStorage.getItem('ebos-quicknotes')
            return saved ? JSON.parse(saved) : []
        } catch { return [] }
    })

    // Customization States
    const [programBarApps, setProgramBarApps] = useState(() => {
        try {
            const saved = localStorage.getItem('ebos-program-apps')
            return saved ? JSON.parse(saved) : ['whiteboard', 'notepad', 'calendar', 'calculator', 'browser', 'lifeprogress', 'dday', 'settings']
        } catch {
            return ['whiteboard', 'notepad', 'calendar', 'calculator', 'browser', 'lifeprogress', 'dday', 'settings']
        }
    })

    const [weatherSettings, setWeatherSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('ebos-weather-settings')
            return saved ? JSON.parse(saved) : { mode: 'auto', city: '' }
        } catch {
            return { mode: 'auto', city: '' }
        }
    })

    // Calculator floating state
    const [calcOpen, setCalcOpen] = useState(false)
    const [calcPos, setCalcPos] = useState({ x: 200, y: 100 })
    const calcDragOffset = useRef({ x: 0, y: 0 })

    // Mini-app framework state
    const [editorApp, setEditorApp] = useState(null)
    const [runningApp, setRunningApp] = useState(null)
    const [floatingApps, setFloatingApps] = useState([])

    // Persist changes
    useEffect(() => {
        localStorage.setItem('ebos-program-apps', JSON.stringify(programBarApps))
    }, [programBarApps])

    useEffect(() => {
        localStorage.setItem('ebos-weather-settings', JSON.stringify(weatherSettings))
    }, [weatherSettings])

    const handleAppOpen = useCallback((appName) => {
        if (appName === 'calculator') {
            setCalcOpen(prev => !prev)
            return
        }
        if (appName !== 'apps' && appName !== 'editor' && appName !== 'miniapprun') {
            setEditorApp(null)
            setRunningApp(null)
        }
        setActiveApp(prev => prev === appName ? null : appName)
    }, [])

    const handleCloseApp = useCallback(() => {
        setActiveApp(null)
        setEditorApp(null)
        setRunningApp(null)
    }, [])

    /* ── QuickNotes ── */
    const addQuickNote = useCallback(() => {
        const colors = ['--note-yellow', '--note-pink', '--note-blue', '--note-green', '--note-purple']
        const newNote = {
            id: Date.now(),
            text: '',
            color: colors[Math.floor(Math.random() * colors.length)],
            x: 120 + Math.random() * 300,
            y: 80 + Math.random() * 200,
            width: 220,
            height: 180,
        }
        setQuickNotes(prev => {
            const updated = [...prev, newNote]
            localStorage.setItem('ebos-quicknotes', JSON.stringify(updated))
            return updated
        })
    }, [])

    const updateQuickNote = useCallback((id, updates) => {
        setQuickNotes(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, ...updates } : n)
            localStorage.setItem('ebos-quicknotes', JSON.stringify(updated))
            return updated
        })
    }, [])

    const deleteQuickNote = useCallback((id) => {
        setQuickNotes(prev => {
            const updated = prev.filter(n => n.id !== id)
            localStorage.setItem('ebos-quicknotes', JSON.stringify(updated))
            return updated
        })
    }, [])

    /* ── Mini-app handlers ── */
    const handleOpenEditor = useCallback((app) => {
        setEditorApp(app)
        setRunningApp(null)
        setActiveApp('editor')
    }, [])

    const handleRunApp = useCallback((app) => {
        const displayMode = app.displayMode || 'fullscreen'
        if (displayMode === 'floating') {
            setFloatingApps(prev => {
                if (prev.find(f => f.app.id === app.id)) return prev
                return [...prev, {
                    id: `float_${Date.now()}`,
                    app,
                    x: 150 + prev.length * 30,
                    y: 80 + prev.length * 30,
                }]
            })
        } else {
            setRunningApp(app)
            setEditorApp(null)
            setActiveApp('miniapprun')
        }
    }, [])

    const closeFloatingApp = useCallback((floatId) => {
        setFloatingApps(prev => prev.filter(f => f.id !== floatId))
    }, [])

    const updateFloatingAppPos = useCallback((floatId, x, y) => {
        setFloatingApps(prev => prev.map(f =>
            f.id === floatId ? { ...f, x, y } : f
        ))
    }, [])

    const handleEditorSave = useCallback(() => { }, [])

    const handleEditorClose = useCallback(() => {
        setEditorApp(null)
        setActiveApp('apps')
    }, [])

    /* ── Calculator drag ── */
    const handleCalcDragStart = useCallback((e) => {
        e.preventDefault()
        const pt = getPointer(e)
        calcDragOffset.current = {
            x: pt.clientX - calcPos.x,
            y: pt.clientY - calcPos.y,
        }
        const handleMove = (ev) => {
            const p = getPointer(ev)
            setCalcPos({
                x: Math.max(0, p.clientX - calcDragOffset.current.x),
                y: Math.max(0, p.clientY - calcDragOffset.current.y),
            })
        }
        const handleUp = () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
            window.removeEventListener('touchmove', handleMove)
            window.removeEventListener('touchend', handleUp)
        }
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        window.addEventListener('touchmove', handleMove, { passive: false })
        window.addEventListener('touchend', handleUp)
    }, [calcPos])

    return (
        <div className="app-container">
            <ProgramBar
                activeApp={activeApp}
                calcOpen={calcOpen}
                userApps={programBarApps}
                allApps={ALL_APPS}
                onAppOpen={handleAppOpen}
                onAddQuickNote={addQuickNote}
            />
            <MainScreen
                activeApp={activeApp}
                onCloseApp={handleCloseApp}
                quickNotes={quickNotes}
                onUpdateQuickNote={updateQuickNote}
                onDeleteQuickNote={deleteQuickNote}
                editorApp={editorApp}
                runningApp={runningApp}
                onOpenEditor={handleOpenEditor}
                onRunApp={handleRunApp}
                onEditorSave={handleEditorSave}
                onEditorClose={handleEditorClose}

                // Customization props
                weatherSettings={weatherSettings}
                onUpdateWeather={setWeatherSettings}
                programApps={programBarApps}
                onUpdateProgramApps={setProgramBarApps}
                allAvailableApps={ALL_APPS}
            />

            {/* Floating Calculator */}
            {calcOpen && (
                <div
                    className="floating-panel"
                    style={{ left: calcPos.x, top: calcPos.y }}
                >
                    <div
                        className="floating-panel-header"
                        onMouseDown={handleCalcDragStart}
                        onTouchStart={handleCalcDragStart}
                    >
                        <MdDragIndicator className="floating-panel-drag-icon" />
                        <span className="floating-panel-title">계산기</span>
                        <button className="floating-panel-close" onClick={() => setCalcOpen(false)}>
                            <MdClose size={14} />
                        </button>
                    </div>
                    <div className="floating-panel-body">
                        <Calculator />
                    </div>
                </div>
            )}

            {/* Floating Mini Apps */}
            {floatingApps.map(fa => (
                <FloatingMiniApp
                    key={fa.id}
                    floatData={fa}
                    onClose={() => closeFloatingApp(fa.id)}
                    onMove={(x, y) => updateFloatingAppPos(fa.id, x, y)}
                    onEdit={() => handleOpenEditor(fa.app)}
                    onUpdateSize={(floatId, width, height) => {
                        setFloatingApps(prev => prev.map(f =>
                            f.id === floatId ? { ...f, app: { ...f.app, floatingSize: { width, height } } } : f
                        ))
                    }}
                />
            ))}
        </div>
    )
}

/* ── Floating Mini App Wrapper ── */
function FloatingMiniApp({ floatData, onClose, onMove, onEdit, onUpdateSize }) {
    const dragOffset = useRef({ x: 0, y: 0 })
    const [size, setSize] = useState(floatData.app.floatingSize || { width: 400, height: 300 })

    const handleDragStart = (e) => {
        e.preventDefault()
        const pt = getPointer(e)
        dragOffset.current = {
            x: pt.clientX - floatData.x,
            y: pt.clientY - floatData.y,
        }
        const handleMove = (ev) => {
            const p = getPointer(ev)
            onMove(
                Math.max(0, p.clientX - dragOffset.current.x),
                Math.max(0, p.clientY - dragOffset.current.y),
            )
        }
        const handleUp = () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
            window.removeEventListener('touchmove', handleMove)
            window.removeEventListener('touchend', handleUp)
        }
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        window.addEventListener('touchmove', handleMove, { passive: false })
        window.addEventListener('touchend', handleUp)
    }

    const handleResizeStart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const pt = getPointer(e)
        const startSize = { ...size }
        const startPos = { x: pt.clientX, y: pt.clientY }

        const handleMove = (ev) => {
            const p = getPointer(ev)
            const newWidth = Math.max(200, startSize.width + (p.clientX - startPos.x))
            const newHeight = Math.max(150, startSize.height + (p.clientY - startPos.y))
            setSize({ width: newWidth, height: newHeight })
        }
        const handleUp = () => {
            onUpdateSize(floatData.id, size.width, size.height)
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
            window.removeEventListener('touchmove', handleMove)
            window.removeEventListener('touchend', handleUp)
        }
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        window.addEventListener('touchmove', handleMove, { passive: false })
        window.addEventListener('touchend', handleUp)
    }

    return (
        <div
            className="floating-panel floating-miniapp"
            style={{
                left: floatData.x,
                top: floatData.y,
                width: size.width,
                height: size.height,
            }}
        >
            <div
                className="floating-panel-header"
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
            >
                <MdDragIndicator className="floating-panel-drag-icon" />
                <span className="floating-panel-title">
                    <MdApps style={{ marginRight: 4 }} />
                    {floatData.app.name}
                </span>
                <button className="floating-panel-close" onClick={onClose}>
                    <MdClose size={14} />
                </button>
            </div>
            <div className="floating-panel-body floating-miniapp-body">
                <MiniAppRunner app={{ ...floatData.app, floatingSize: size }} onClose={onClose} onEdit={onEdit} />
            </div>
            {/* Resize Handle */}
            <div
                className="floating-resize-handle"
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
            />
        </div>
    )
}

export default App
