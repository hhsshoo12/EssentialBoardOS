import { MdClose, MdEditNote, MdCalendarMonth, MdLanguage, MdApps, MdTimeline, MdEvent, MdSettings } from 'react-icons/md'
import { HiPaintBrush } from 'react-icons/hi2'
import ClockWeather from '../apps/ClockWeather'
import QuickNote from '../apps/QuickNote'
import Notepad from '../apps/Notepad'

import Calendar from '../apps/Calendar'
import Whiteboard from '../apps/Whiteboard'
import MiniBrowser from '../apps/MiniBrowser'
import LifeProgress from '../apps/LifeProgress'
import DDay from '../apps/DDay'
import Settings from '../apps/Settings'
import NodeEditor from '../framework/NodeEditor'
import MiniAppRunner from '../framework/MiniAppRunner'
import AppManager from '../framework/AppManager'
import './MainScreen.css'

const appMeta = {
    whiteboard: { title: '화이트보드', icon: HiPaintBrush, component: Whiteboard },
    notepad: { title: '메모장', icon: MdEditNote, component: Notepad },
    calendar: { title: '캘린더', icon: MdCalendarMonth, component: Calendar },
    calculator: null, // now floating, handled in App.jsx
    browser: { title: '미니브라우저', icon: MdLanguage, component: MiniBrowser },
    lifeprogress: { title: '라이프 프로그레스', icon: MdTimeline, component: LifeProgress },
    dday: { title: 'D-Day', icon: MdEvent, component: DDay },
    settings: { title: '설정', icon: MdSettings, component: Settings },
}

function MainScreen({
    activeApp, onCloseApp,
    quickNotes, onUpdateQuickNote, onDeleteQuickNote,
    editorApp, runningApp,
    onOpenEditor, onRunApp, onEditorSave, onEditorClose,
    // Customization
    weatherSettings, onUpdateWeather,
    programApps, onUpdateProgramApps,
    allAvailableApps
}) {
    const isFixedApp = activeApp && appMeta[activeApp]
    const appInfo = isFixedApp ? appMeta[activeApp] : null
    const AppComponent = appInfo?.component

    return (
        <div className="main-screen">
            {/* Default: Clock & Weather */}
            {!activeApp && <ClockWeather settings={weatherSettings} />}

            {/* Fixed App Window */}
            {isFixedApp && AppComponent && (
                <div className="app-window">
                    <div className="app-window-header">
                        <span className="app-window-title">
                            <appInfo.icon size={18} />
                            {appInfo.title}
                        </span>
                        <button className="app-window-close" onClick={onCloseApp}>
                            <MdClose />
                        </button>
                    </div>
                    <div className="app-window-body">
                        {activeApp === 'settings' ? (
                            <Settings
                                weatherSettings={weatherSettings}
                                onUpdateWeather={onUpdateWeather}
                                programApps={programApps}
                                onUpdateProgramApps={onUpdateProgramApps}
                                allAvailableApps={allAvailableApps}
                            />
                        ) : (
                            <AppComponent />
                        )}
                    </div>
                </div>
            )}

            {/* App Manager */}
            {activeApp === 'apps' && (
                <div className="app-window">
                    <div className="app-window-header">
                        <span className="app-window-title">
                            <MdApps size={18} />
                            미니앱
                        </span>
                        <button className="app-window-close" onClick={onCloseApp}>
                            <MdClose />
                        </button>
                    </div>
                    <div className="app-window-body">
                        <AppManager onOpenEditor={onOpenEditor} onRunApp={onRunApp} />
                    </div>
                </div>
            )}

            {/* Node Editor (fullscreen-like) */}
            {activeApp === 'editor' && editorApp && (
                <div className="app-window">
                    <div className="app-window-body" style={{ padding: 0 }}>
                        <NodeEditor
                            app={editorApp}
                            onSave={onEditorSave}
                            onClose={onEditorClose}
                        />
                    </div>
                </div>
            )}

            {/* Mini App Runner */}
            {activeApp === 'miniapprun' && runningApp && (
                <div className="app-window">
                    <div className="app-window-header">
                        <span className="app-window-title">
                            <MdApps size={18} />
                            {runningApp.name}
                        </span>
                        <button className="app-window-close" onClick={onCloseApp}>
                            <MdClose />
                        </button>
                    </div>
                    <div className="app-window-body">
                        <MiniAppRunner
                            app={runningApp}
                            onClose={onCloseApp}
                            onEdit={() => onOpenEditor(runningApp)}
                        />
                    </div>
                </div>
            )}

            {/* Quick Notes Overlay */}
            {quickNotes.map(note => (
                <QuickNote
                    key={note.id}
                    note={note}
                    onUpdate={onUpdateQuickNote}
                    onDelete={onDeleteQuickNote}
                />
            ))}
        </div>
    )
}

export default MainScreen
