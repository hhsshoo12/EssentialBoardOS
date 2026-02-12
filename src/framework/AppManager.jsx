import { useState, useCallback } from 'react'
import { MdAdd, MdApps, MdDelete, MdEdit, MdPlayArrow } from 'react-icons/md'
import { getSavedApps, createEmptyApp, saveApp, deleteApp } from './nodeSchema'
import './MiniAppRunner.css'

/**
 * AppManager - 미니앱 목록 관리 (생성, 편집, 실행, 삭제)
 */
function AppManager({ onOpenEditor, onRunApp }) {
    const [apps, setApps] = useState(getSavedApps)

    const refreshApps = useCallback(() => {
        setApps(getSavedApps())
    }, [])

    const handleCreate = useCallback(() => {
        const newApp = createEmptyApp()
        saveApp(newApp)
        refreshApps()
        onOpenEditor(newApp)
    }, [onOpenEditor, refreshApps])

    const handleDelete = useCallback((e, appId) => {
        e.stopPropagation()
        deleteApp(appId)
        refreshApps()
    }, [refreshApps])

    const handleEdit = useCallback((e, app) => {
        e.stopPropagation()
        onOpenEditor(app)
    }, [onOpenEditor])

    const handleRun = useCallback((app) => {
        onRunApp(app)
    }, [onRunApp])

    const formatDate = (iso) => {
        try {
            return new Date(iso).toLocaleDateString('ko-KR', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })
        } catch { return '' }
    }

    return (
        <div className="app-manager">
            <div className="am-header">
                <h2>미니앱</h2>
                <p>노드 기반 비주얼 스크립팅으로 나만의 앱을 만들어보세요</p>
            </div>

            <div className="am-toolbar">
                <button className="am-create-btn" onClick={handleCreate}>
                    <MdAdd size={16} /> 새 앱 만들기
                </button>
            </div>

            <div className="am-app-grid">
                {apps.length === 0 ? (
                    <div className="am-empty">
                        <div className="am-empty-icon">📦</div>
                        <h3>아직 만든 앱이 없어요</h3>
                        <p>&ldquo;새 앱 만들기&rdquo; 버튼을 눌러 시작하세요</p>
                    </div>
                ) : (
                    apps.map(app => (
                        <div key={app.id} className="am-app-card" onClick={() => handleRun(app)}>
                            <div className="am-app-icon">
                                <MdApps />
                            </div>
                            <div className="am-app-name">{app.name}</div>
                            <div className="am-app-meta">
                                UI {app.uiComponents?.length || 0}개 · 노드 {app.nodes?.length || 0}개
                            </div>
                            <div className="am-app-meta">{formatDate(app.updatedAt)}</div>
                            <div className="am-app-actions">
                                <button className="am-app-action-btn" onClick={(e) => handleEdit(e, app)}>
                                    <MdEdit size={12} /> 편집
                                </button>
                                <button className="am-app-action-btn" onClick={(e) => { e.stopPropagation(); handleRun(app) }}>
                                    <MdPlayArrow size={12} /> 실행
                                </button>
                                <button className="am-app-action-btn danger" onClick={(e) => handleDelete(e, app.id)}>
                                    <MdDelete size={12} /> 삭제
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default AppManager
