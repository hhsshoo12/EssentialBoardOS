import { useState, useEffect, useRef, useCallback } from 'react'
import { MdClose, MdEdit } from 'react-icons/md'
import { MiniAppRuntime } from './Runtime'
import './MiniAppRunner.css'

/**
 * MiniAppRunner - JSON 미니앱을 실행하는 런타임 컴포넌트
 * Multi-page 지원: uiComponent.pageId 로 페이지별 필터링
 */
function MiniAppRunner({ app, onClose, onEdit }) {
    const [uiState, setUiState] = useState({})
    const [currentPage, setCurrentPage] = useState('page_0')
    const runtimeRef = useRef(null)

    useEffect(() => {
        if (!app) return

        const runtime = new MiniAppRuntime(app, {
            onSetText: (targetId, value) => {
                setUiState(prev => ({
                    ...prev,
                    [targetId]: { ...prev[targetId], text: value },
                }))
            },
            onSetStyle: (targetId, prop, value) => {
                setUiState(prev => ({
                    ...prev,
                    [targetId]: {
                        ...prev[targetId],
                        style: { ...(prev[targetId]?.style || {}), [prop]: value },
                    },
                }))
            },
            onAlert: (msg) => alert(msg),
            onLog: (msg) => console.log('[MiniApp]', msg),
            onGetInputValue: (targetId) => uiState[targetId]?.value || '',
            onNavigatePage: (pageId) => setCurrentPage(pageId),
        })

        runtimeRef.current = runtime
        runtime.start()

        return () => {
            runtime.stop()
            runtimeRef.current = null
        }
    }, [app])

    const handleInputChange = useCallback((compId, value) => {
        setUiState(prev => ({
            ...prev,
            [compId]: { ...prev[compId], value },
        }))
    }, [])

    if (!app) return null

    // Filter UI components by current page
    const pages = app.pages || [{ id: 'page_0', name: '메인 페이지' }]
    const visibleComponents = app.uiComponents.filter(
        comp => (comp.pageId || 'page_0') === currentPage
    )

    return (
        <div className="miniapp-runner">
            <div className="mar-toolbar">
                <span className="mar-toolbar-title">{app.name}</span>
                {pages.length > 1 && (
                    <div className="mar-page-tabs">
                        {pages.map(page => (
                            <button
                                key={page.id}
                                className={`mar-page-tab ${currentPage === page.id ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page.id)}
                            >
                                {page.name}
                            </button>
                        ))}
                    </div>
                )}
                <div className="mar-toolbar-spacer" />
                {onEdit && (
                    <button className="mar-toolbar-btn" onClick={() => onEdit(app)}>
                        <MdEdit size={14} /> 편집
                    </button>
                )}
            </div>

            <div className="mar-canvas">
                <div
                    className="mar-app-canvas"
                    style={{
                        width: app.canvas.width,
                        height: app.canvas.height,
                        backgroundColor: app.canvas.backgroundColor,
                    }}
                >
                    {visibleComponents.map(comp => {
                        const overrides = uiState[comp.id] || {}
                        const style = { ...comp.style, ...(overrides.style || {}) }
                        const text = overrides.text !== undefined ? overrides.text : comp.props.text

                        return (
                            <div key={comp.id} className="mar-ui-element" style={{ left: comp.x, top: comp.y }}>
                                {comp.type === 'button' && (
                                    <button
                                        style={style}
                                        onClick={() => runtimeRef.current?.handleEvent('onClick', comp.id)}
                                    >
                                        {text}
                                    </button>
                                )}
                                {comp.type === 'text' && <div style={style}>{text}</div>}
                                {comp.type === 'input' && (
                                    <input
                                        style={style}
                                        placeholder={comp.props.placeholder}
                                        value={overrides.value ?? comp.props.value ?? ''}
                                        onChange={(e) => handleInputChange(comp.id, e.target.value)}
                                    />
                                )}
                                {comp.type === 'image' && (
                                    comp.props.src
                                        ? <img src={comp.props.src} alt={comp.props.alt} style={style} />
                                        : <div style={{ ...style, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🖼️</div>
                                )}
                                {comp.type === 'container' && <div style={style}></div>}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default MiniAppRunner
