import { useState, useEffect } from 'react'
import { MdSave, MdSettings, MdCloud, MdViewList, MdArrowUpward, MdArrowDownward, MdAdd, MdDelete } from 'react-icons/md'
import { HiPaintBrush } from 'react-icons/hi2'
import './Settings.css'

function Settings({
    weatherSettings, onUpdateWeather,
    programApps, onUpdateProgramApps,
    allAvailableApps // { id, label, icon }
}) {
    const [activeTab, setActiveTab] = useState('weather')

    return (
        <div className="settings-app">
            <aside className="settings-sidebar">
                <button
                    className={`settings-tab-btn ${activeTab === 'weather' ? 'active' : ''}`}
                    onClick={() => setActiveTab('weather')}
                >
                    <MdCloud /> 날씨 설정
                </button>
                <button
                    className={`settings-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('appearance')}
                >
                    <MdViewList /> 프로그램바 관리
                </button>
            </aside>

            <main className="settings-content">
                {activeTab === 'weather' && (
                    <WeatherSettings settings={weatherSettings} onUpdate={onUpdateWeather} />
                )}
                {activeTab === 'appearance' && (
                    <ProgramBarSettings
                        currentApps={programApps}
                        onUpdate={onUpdateProgramApps}
                        allApps={allAvailableApps}
                    />
                )}
            </main>
        </div>
    )
}

function WeatherSettings({ settings, onUpdate }) {
    const [city, setCity] = useState(settings.city || '')
    const [mode, setMode] = useState(settings.mode || 'auto')

    const handleSave = () => {
        onUpdate({ mode, city })
    }

    return (
        <div className="settings-section">
            <h3 className="settings-section-title">날씨 위치 설정</h3>
            <div className="settings-row">
                <label>모드</label>
                <div className="settings-toggle-group">
                    <button
                        className={mode === 'auto' ? 'active' : ''}
                        onClick={() => setMode('auto')}
                    >자동 (GPS)</button>
                    <button
                        className={mode === 'manual' ? 'active' : ''}
                        onClick={() => setMode('manual')}
                    >수동 (도시명)</button>
                </div>
            </div>

            {mode === 'manual' && (
                <div className="settings-row">
                    <label>도시 이름</label>
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="예: Seoul, Tokyo, London..."
                    />
                </div>
            )}

            <button className="settings-save-btn" onClick={handleSave}>
                <MdSave /> 저장하기
            </button>
        </div>
    )
}

function ProgramBarSettings({ currentApps, onUpdate, allApps }) {
    // Reorder logic
    const moveApp = (index, direction) => {
        const newApps = [...currentApps]
        const targetIndex = index + direction
        if (targetIndex < 0 || targetIndex >= newApps.length) return

        const temp = newApps[index]
        newApps[index] = newApps[targetIndex]
        newApps[targetIndex] = temp
        onUpdate(newApps)
    }

    const removeApp = (appId) => {
        onUpdate(currentApps.filter(id => id !== appId))
    }

    const addApp = (appId) => {
        if (!currentApps.includes(appId)) {
            onUpdate([...currentApps, appId])
        }
    }

    return (
        <div className="settings-section">
            <h3 className="settings-section-title">아이콘 순서 및 관리</h3>
            <div className="settings-app-list">
                {currentApps.map((appId, index) => {
                    const appInfo = allApps.find(a => a.id === appId)
                    if (!appInfo) return null
                    return (
                        <div key={appId} className="settings-app-item">
                            <div className="settings-app-info">
                                <appInfo.icon />
                                <span>{appInfo.label}</span>
                            </div>
                            <div className="settings-app-actions">
                                <button onClick={() => moveApp(index, -1)} disabled={index === 0}><MdArrowUpward /></button>
                                <button onClick={() => moveApp(index, 1)} disabled={index === currentApps.length - 1}><MdArrowDownward /></button>
                                <button
                                    className="delete"
                                    onClick={() => removeApp(appId)}
                                    disabled={appId === 'settings'}
                                    title={appId === 'settings' ? "설정 앱은 제거할 수 없습니다" : "제거"}
                                >
                                    <MdDelete />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            <h3 className="settings-section-title" style={{ marginTop: '24px' }}>추가 가능한 앱</h3>
            <div className="settings-available-list">
                {allApps.filter(app => !currentApps.includes(app.id)).map(app => (
                    <div key={app.id} className="settings-app-item">
                        <div className="settings-app-info">
                            <app.icon />
                            <span>{app.label}</span>
                        </div>
                        <button className="add" onClick={() => addApp(app.id)}><MdAdd /></button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Settings
